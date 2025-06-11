// Production entry point for Render deployment
import('./production.js')
  .then(() => {
    console.log('Production server started successfully');
  })
  .catch((error) => {
    console.error('Failed to start production server:', error);
    process.exit(1);
  });