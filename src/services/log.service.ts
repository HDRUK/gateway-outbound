const LoggerGCP = require('simple-gcp-logging');

export default class LoggingService {
    _logger;
    constructor() {
        this._logger = LoggerGCP.createLoggerGCP({
            projectId: process.env.LOGGING_PROJECT_ID,
            logName: process.env.LOGGING_LOG_NAME,
        });
    }

    sendDataInLogging(data: any, severity: string) {
        const logMessage = {
            application: 'gateway-outbound',
            data: JSON.parse(JSON.stringify(data, null, 4)),
        };
        this._logger.setData(logMessage);
        this._logger.setSeverity(severity);
        this._logger.writeLog();
    }
}
