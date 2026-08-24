/* setup globale eseguito prima di ogni file di test. imposta le variabili
   d'ambiente necessarie ai moduli che le leggono (es. jwt) così i test
   unitari non dipendono dal file .env reale del progetto. */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.NODE_ENV = 'test';
