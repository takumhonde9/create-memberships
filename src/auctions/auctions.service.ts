import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import Stripe from 'stripe';
import { StripeConfig } from './config';
import { ConfigType } from '@nestjs/config';
import { Auction, AuctionBid } from '@prisma/client';

function capAt(num: number, max: number) {
  return num > max ? max : num;
}

export enum AuctionStatusEnum {
  Started = 'S',
  Aborted = 'A',
  Processing = 'P',
  Ended = 'E',
}

export enum PaymentStatusEnum {
  Succeeded = 'withdrawn',
  Failed = 'failed',
  CancellationFailure = 'cancellation_failure',
  Cancelled = 'cancelled',
}

@Injectable()
export class AuctionsService {
  stripe: Stripe;

  constructor(
    @Inject(StripeConfig.KEY)
    private readonly config: ConfigType<typeof StripeConfig>,
    private prismaService: PrismaService,
  ) {
    this.stripe = new Stripe(config.Secret, {
      apiVersion: '2024-06-20',
    });
  }

  async process(data: { auctionIds: number[] }) {
    const auctions = await this.prismaService.auction.findMany({
      where: {
        id: {
          in: data.auctionIds,
        },
      },
      include: {
        _count: {
          select: {
            bids: true,
          },
        },
      },
    });

    const closeAuction = async (id: number) => {
      await this.prismaService.auction.update({
        where: {
          id: id,
        },
        data: {
          statusCode: AuctionStatusEnum.Ended,
        },
      });
    };

    for await (const auction of auctions) {
      if (auction.statusCode !== AuctionStatusEnum.Processing) {
        continue;
      }
      // if the auction ended with no bids - skip it
      if (auction._count.bids === 0) {
        console.log({
          message: 'Auction has no bids',
          context: {
            auctionId: auction.id,
          },
        });

        await closeAuction(auction.id);
        continue;
      }

      await this.processAllBids(auction);

      await closeAuction(auction.id);
    }
  }

  async processAllBids(auction: Auction) {
    const batchSize = 100;
    let offset = 0;
    let bids: AuctionBid[];
    let remainingMemberships = capAt(
      auction.seats,
      this.config.MaximumNumberSeats,
    );

    do {
      bids = bids = await this.prismaService.auctionBid.findMany({
        skip: offset,
        take: batchSize,
        where: {
          auctionId: auction.id,
        },
        orderBy: {
          amount: 'desc',
        },
      });

      for await (const bid of bids) {
        if (remainingMemberships > 0) {
          try {
            await this.processWinningBid(bid.accountId, auction.clubId);

            remainingMemberships--;
          } catch (e) {
            await this.processLosingBid(bid.accountId);
          }
        } else {
          await this.processLosingBid(bid.accountId);
        }
      }

      offset += batchSize;
    } while (bids.length > 0);
  }

  async processLosingBid(accountId: string) {
    const isDevEnv = this.config.NestEnvironment !== 'development';

    const payment = await this.prismaService.payment.findFirst({
      where: {
        bid: {
          accountId,
        },
      },
    });

    try {
      if (isDevEnv) {
        await this.stripe.paymentIntents.cancel(payment.externalId);
      }

      await this.prismaService.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: PaymentStatusEnum.Cancelled,
          message: 'Successfully removed hold on the payment method.',
        },
      });

      console.log(`Send "AUCTION_LOST" notification ${accountId}`);
    } catch (e) {
      console.error(`[processLosingBid] Error: ${e}`);

      await this.prismaService.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: PaymentStatusEnum.CancellationFailure,
          message:
            'Failed to remove hold. You can contact support or wait 7 business days.',
        },
      });

      return;
    }
  }

  async processWinningBid(accountId: string, clubId: string) {
    const isDevEnv = this.config.NestEnvironment !== 'development';

    // get the payment intent
    const payment = await this.prismaService.payment.findFirst({
      where: {
        bid: {
          accountId,
        },
      },
    });

    // process the payment on stripe
    try {
      if (isDevEnv) {
        const response = await this.stripe.paymentIntents.capture(
          payment.externalId,
        );

        if (response.status !== 'succeeded') {
          await this.prismaService.payment.update({
            where: {
              id: payment.id,
            },
            data: {
              status: PaymentStatusEnum.Failed,
              message: `Stripe message: ${response.status}`,
            },
          });
        }

        return;
      }

      // create a membership
      const membershipCount = await this.prismaService.clubMembership.count({
        where: {
          clubId,
        },
      });

      await this.prismaService.clubMembership.create({
        data: {
          clubId,
          number: membershipCount + 1,
          ownerId: accountId,
        },
      });

      await this.prismaService.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: PaymentStatusEnum.Succeeded,
          message: 'Successfully processed payment.',
        },
      });

      // create a "NEW_MEMBERSHIP" event and create notification
      console.log('Send "AUCTION_WON" notification');
    } catch (e) {
      console.error(`[processWinningBid] Error: ${e}`);
      // update the payments
      await this.prismaService.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: PaymentStatusEnum.Failed,
          message: 'Failed to capture the funds. Something went wrong.',
        },
      });

      // create a "PAYMENT_FAILED" event and create notification
      console.log('Send "PAYMENT_FAILED" notification');
    }
  }
}
