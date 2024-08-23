import { Inject, Injectable } from '@nestjs/common';
import { Account, Artist, Auction, AuctionBid, Club } from '@prisma/client';
import { ConfigType } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeConfig } from './config';
import { PrismaService } from '../prisma';
import {
  NotificationsService,
  UserEvent,
  UserEventsUtility,
} from '../notifications';
import { AuctionStatusEnum, PaymentStatusEnum } from './enums';
import { capAt, EntityNameEnum } from '../common';

type AuctionResponse = Auction & {
  _count: { bids: number };
  club: Club & { artist: Artist & { account: Account } };
};

@Injectable()
export class AuctionsService {
  stripe: Stripe;

  constructor(
    @Inject(StripeConfig.KEY)
    private readonly config: ConfigType<typeof StripeConfig>,
    private readonly userEventsUtility: UserEventsUtility,
    private readonly notificationsService: NotificationsService,
    private readonly prismaService: PrismaService,
  ) {
    this.stripe = new Stripe(config.Secret, {
      apiVersion: '2024-06-20',
    });
  }

  async process(data: { auctionIds: number[] }) {
    const auctions = (await this.prismaService.auction.findMany({
      where: {
        id: {
          in: data.auctionIds,
        },
      },
      include: {
        club: { include: { artist: { include: { account: true } } } },
        _count: {
          select: {
            bids: true,
          },
        },
      },
    })) as Array<AuctionResponse>;

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
        await closeAuction(auction.id);
        continue;
      }

      await this.processAllBids(auction);

      await closeAuction(auction.id);
    }
  }

  async processAllBids(auction: AuctionResponse) {
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
            await this.processWinningBid(
              bid.accountId,
              auction.clubId,
              auction.club.artist.account.id,
            );

            remainingMemberships--;
          } catch (e) {
            await this.processLosingBid(bid.accountId, auction.clubId);
          }
        } else {
          await this.processLosingBid(bid.accountId, auction.clubId);
        }
      }

      offset += batchSize;
    } while (bids.length > 0);
  }

  async processLosingBid(bidderAccountId: string, clubId: string) {
    const isDevEnv = this.config.NestEnvironment !== 'development';

    const payment = await this.prismaService.payment.findFirst({
      where: {
        bid: {
          accountId: bidderAccountId,
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

      console.log(`Send "AUCTION_LOST" notification ${bidderAccountId}`);
      await this.userEventsUtility
        .createOne({
          event: {
            name: UserEvent.Auction.Lost,
            actor: bidderAccountId,
          },
          entity: {
            name: EntityNameEnum.Club,
            id: clubId,
          },
        })
        .then(
          async (event) =>
            await this.notificationsService.create({
              data: {
                recipientId: bidderAccountId,
                eventId: event.id,
              },
            }),
        );
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

  async processWinningBid(
    bidderAccountId: string,
    clubId: string,
    artistAccountId: string,
  ) {
    const isDevEnv = this.config.NestEnvironment !== 'development';

    // get the payment intent
    const payment = await this.prismaService.payment.findFirst({
      where: {
        bid: {
          accountId: bidderAccountId,
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

        // Send PaymentFailed notification
        await this.userEventsUtility
          .createOne({
            event: {
              name: UserEvent.Payment.Failed,
              actor: bidderAccountId,
            },
            entity: {
              name: EntityNameEnum.Payment,
              id: payment.id.toString(),
            },
          })
          .then(
            async (event) =>
              await this.notificationsService.create({
                data: {
                  recipientId: bidderAccountId,
                  eventId: event.id,
                },
              }),
          );

        return;
      }

      // create a membership
      const membershipCount = await this.prismaService.clubMembership.count({
        where: {
          clubId,
        },
      });

      const membership = await this.prismaService.clubMembership.create({
        data: {
          clubId,
          number: membershipCount + 1,
          ownerId: bidderAccountId,
          membershipOnPayments: {
            create: {
              paymentId: payment.id,
            },
          },
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
      await this.userEventsUtility
        .createOne({
          event: {
            name: UserEvent.Club.Joined,
            actor: bidderAccountId,
          },
          entity: {
            name: EntityNameEnum.ClubMembership,
            id: membership.id,
          },
        })
        .then(
          async (event) =>
            await this.notificationsService.create({
              data: {
                recipientId: bidderAccountId,
                eventId: event.id,
              },
            }),
        );
      // create a "PAYMENT_RECEIVED" event and create notification
      await this.userEventsUtility
        .createOne({
          event: {
            name: UserEvent.Payment.Received,
            actor: bidderAccountId,
          },
          entity: {
            name: EntityNameEnum.Payment,
            id: payment.id.toString(),
          },
        })
        .then(
          async (event) =>
            await this.notificationsService.create({
              data: {
                recipientId: artistAccountId,
                eventId: event.id,
              },
            }),
        );
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
      await this.userEventsUtility
        .createOne({
          event: {
            name: UserEvent.Payment.Failed,
            actor: bidderAccountId,
          },
          entity: {
            name: EntityNameEnum.Payment,
            id: payment.id.toString(),
          },
        })
        .then(
          async (event) =>
            await this.notificationsService.create({
              data: {
                recipientId: bidderAccountId,
                eventId: event.id,
              },
            }),
        );
    }
  }
}
