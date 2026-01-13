// Azure Functions v4 entry point
// Import all function modules to register them with the app

// Auth functions
import './auth/login';
import './auth/signup';
import './auth/verify-email';

// Resume functions
import './resume/save';
import './resume/list';
import './resume/get';
import './resume/enhance';

// Analytics functions
import './analytics/events';

// Chat function (AI conversational mode)
import './chat/index';
