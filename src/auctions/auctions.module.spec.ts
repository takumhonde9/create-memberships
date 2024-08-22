import { Test } from '@nestjs/testing';
import { AuctionsService } from './auctions.service';

describe('DummyModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      providers: [AuctionsService],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get(AuctionsService)).toBeInstanceOf(AuctionsService);
  });
});
