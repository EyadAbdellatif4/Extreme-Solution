import { Test, TestingModule } from '@nestjs/testing';
import { ConciliationService } from './conciliation.service';

describe('ConciliationService', () => {
  let service: ConciliationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConciliationService],
    }).compile();

    service = module.get<ConciliationService>(ConciliationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
