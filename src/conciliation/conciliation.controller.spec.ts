import { Test, TestingModule } from '@nestjs/testing';
import { ConciliationController } from './conciliation.controller';
import { ConciliationService } from './conciliation.service';

describe('ConciliationController', () => {
  let controller: ConciliationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConciliationController],
      providers: [ConciliationService],
    }).compile();

    controller = module.get<ConciliationController>(ConciliationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
