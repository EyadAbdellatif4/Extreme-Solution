import { 
  Controller, 
  Post, 
  HttpException, 
  HttpStatus, 
  UseInterceptors, 
  UploadedFiles 
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ConciliationService } from './conciliation.service';
import { ReconciliationResultDto } from './dto/conciliation.dto';

@Controller('conciliation')
export class ConciliationController {
  constructor(private readonly conciliationService: ConciliationService) {}

  @Post('reconcile')
  @UseInterceptors(FilesInterceptor('files', 2, {
    fileFilter: (req, file, callback) => {
      if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
        return callback(new Error('Only CSV files are allowed!'), false);
      }
      callback(null, true);
    },
  }))
  async reconcileTransactions(
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<ReconciliationResultDto> {
    try {
      if (!files || files.length !== 2) {
        throw new HttpException(
          'Please upload exactly 2 CSV files: source_transactions.csv and system_transactions.csv',
          HttpStatus.BAD_REQUEST,
        );
      }

      let sourceFile: Express.Multer.File | undefined;
      let systemFile: Express.Multer.File | undefined;

      files.forEach(file => {
        if (file.originalname.toLowerCase().includes('source')) {
          sourceFile = file;
        } else if (file.originalname.toLowerCase().includes('system')) {
          systemFile = file;
        }
      });

      if (!sourceFile || !systemFile) {
        sourceFile = files[0];
        systemFile = files[1];
      }

      return await this.conciliationService.reconcileTransactions(sourceFile, systemFile);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to reconcile transactions',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
