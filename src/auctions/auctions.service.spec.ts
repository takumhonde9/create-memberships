import { Test, TestingModule } from '@nestjs/testing';
import { AuctionsService } from './auctions.service';

describe('DummyService', () => {
  let service: AuctionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuctionsService],
    }).compile();

    service = module.get<AuctionsService>(AuctionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fn', () => {
    it("should be return 'Successfully executed.'", () => {
      const expected = 'Successfully executed.';

      const result = service.fn({ name: 'some name' });

      expect(result).toEqual(expected);
    });

    it('should be throw an error if there is no data.', () => {
      const errorMessage = 'Invalid data format';

      expect(() => {
        service.fn({});
      }).toThrow(Error(errorMessage));
    });
  });
});
