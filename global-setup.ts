const environment = 'dev'; // or uat

async function globalSetup() {
    process.env.ENVIRONMENT = environment == 'dev' ? 'dev' : 'uat';
}
