import pool from "./db/pool.js";
import env from "./config/env.js";
import { PostgresDatasetRepository } from "./repositories/postgresDatasetRepository.js";
import { PostgresReportingRepository } from "./repositories/postgresReportingRepository.js";
import { PostgresUserRepository } from "./repositories/postgresUserRepository.js";
import { PostgresRefreshTokenRepository } from "./repositories/postgresRefreshTokenRepository.js";
import { ImportService } from "./services/importService.js";
import { ReportingService } from "./services/reportingService.js";
import { PasswordHasher } from "./services/passwordHasher.js";
import { TokenService } from "./services/tokenService.js";
import { AuthService } from "./services/authService.js";
import { DatasetController } from "./controllers/datasetController.js";
import { DashboardController } from "./controllers/dashboardController.js";
import { AuthController } from "./controllers/authController.js";
import { AuthMiddleware } from "./middlewares/authMiddleware.js";
import { InMemoryRateLimiter } from "./middlewares/rateLimiter.js";
import { AuthCookieConfig } from "./config/cookieConfig.js";
import { CHECKLIST_FORMAT, POLICY_VERSION } from "./domain/constants.js";

// Domain Classes
import { FileHasher } from "./domain/FileHasher.js";
import { StrictCsvParser } from "./domain/StrictCsvParser.js";
import { FieldAliasResolver } from "./domain/FieldAliasResolver.js";
import { StatusClassifier } from "./domain/StatusClassifier.js";
import { RowNormalizer } from "./domain/RowNormalizer.js";
import { DuplicateRemover } from "./domain/DuplicateRemover.js";
import { AgentEvidenceResolver } from "./domain/AgentEvidenceResolver.js";
import { SlotResolver } from "./domain/SlotResolver.js";
import { MissingSlotGenerator } from "./domain/MissingSlotGenerator.js";
import { QualityMetricsCalculator } from "./domain/QualityMetricsCalculator.js";
import { SlaCsvProcessor } from "./domain/SlaCsvProcessor.js";
import { SlaDatasetImporter } from "./services/SlaDatasetImporter.js";

// Instantiate OOP pipeline dependencies with explicit constructors
export const fileHasher = new FileHasher();
export const strictCsvParser = new StrictCsvParser();
export const fieldAliasResolver = new FieldAliasResolver();
export const statusClassifier = new StatusClassifier();
export const rowNormalizer = new RowNormalizer(statusClassifier, fieldAliasResolver);
export const duplicateRemover = new DuplicateRemover();
export const agentEvidenceResolver = new AgentEvidenceResolver();
export const slotResolver = new SlotResolver();
export const missingSlotGenerator = new MissingSlotGenerator();
export const qualityMetricsCalculator = new QualityMetricsCalculator();

export const slaCsvProcessor = new SlaCsvProcessor(
  strictCsvParser,
  rowNormalizer,
  duplicateRemover,
  agentEvidenceResolver,
  slotResolver,
  missingSlotGenerator,
  qualityMetricsCalculator,
);

export const datasetRepository = new PostgresDatasetRepository(pool);
export const reportingRepository = new PostgresReportingRepository(pool);

// Auth
export const passwordHasher = new PasswordHasher();
export const tokenService = new TokenService(
  env.ACCESS_TOKEN_SECRET,
  env.REFRESH_TOKEN_SECRET,
);
export const userRepository = new PostgresUserRepository(pool);
export const refreshTokenRepository = new PostgresRefreshTokenRepository(pool);
export const authService = new AuthService(
  userRepository,
  refreshTokenRepository,
  passwordHasher,
  tokenService,
);
export const authCookieConfig = new AuthCookieConfig();
export const authMiddleware = new AuthMiddleware(tokenService);
export const authController = new AuthController(authService, authCookieConfig);
export const loginLimiter = new InMemoryRateLimiter({ windowMs: 60_000, max: 5 });
export const registerLimiter = new InMemoryRateLimiter({ windowMs: 60_000, max: 5 });

export const slaDatasetImporter = new SlaDatasetImporter(
  slaCsvProcessor,
  datasetRepository,
  fileHasher,
);

export const importService = new ImportService(
  datasetRepository,
  {
    format: CHECKLIST_FORMAT,
    version: POLICY_VERSION,
    policyVersion: POLICY_VERSION,
  },
  slaDatasetImporter,
);

export const reportingService = new ReportingService(reportingRepository);

export const datasetController = new DatasetController(importService);
export const dashboardController = new DashboardController(reportingService);