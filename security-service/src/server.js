import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import security controllers
import securityEventController from './controllers/securityEventController.js';
import securityAlertController from './controllers/securityAlertController.js';
import securityIncidentController from './controllers/securityIncidentController.js';
import riskAssessmentController from './controllers/riskAssessmentController.js';
import threatDetectionController from './controllers/threatDetectionController.js';
import healthController from './controllers/healthController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load security service proto
const dockerSharedProtoPath = path.join('/shared-lib', 'protos', 'security.proto');
const localSharedProtoPath = path.join(__dirname, '..', '..', 'shared-lib', 'protos', 'security.proto');
const localProtoPath = path.join(__dirname, 'proto', 'security.proto');

let PROTO_PATH;
if (fs.existsSync(dockerSharedProtoPath)) {
  PROTO_PATH = dockerSharedProtoPath;
} else if (fs.existsSync(localSharedProtoPath)) {
  PROTO_PATH = localSharedProtoPath;
} else {
  PROTO_PATH = localProtoPath;
}

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const securityProto = grpc.loadPackageDefinition(packageDefinition).security;

// Create gRPC server
const server = new grpc.Server();

// Add SecurityService
server.addService(securityProto.SecurityService.service, {
  // Event Management
  SubmitEvent: securityEventController.submitEvent,
  GetEvents: securityEventController.getEvents,
  
  // Alert Management
  GetAlerts: securityAlertController.getAlerts,
  AcknowledgeAlert: securityAlertController.acknowledgeAlert,
  
  // Incident Management
  GetIncidents: securityIncidentController.getIncidents,
  ResolveIncident: securityIncidentController.resolveIncident,
  
  // Risk Assessment
  GetRiskScore: riskAssessmentController.getRiskScore,
  UpdateRiskScore: riskAssessmentController.updateRiskScore,
  
  // Analytics
  GetAnalytics: threatDetectionController.getAnalytics,
  GetThreatPatterns: threatDetectionController.getThreatPatterns,
});

// Add HealthService
server.addService(securityProto.HealthService.service, {
  Check: healthController.check,
});

export { server };