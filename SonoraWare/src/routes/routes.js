import { Router } from 'express';
import ArtistController from '../controllers/ArtistController.js';
import BandController from '../controllers/BandController.js';
import UserController from '../controllers/UserController.js';
import { authenticate, ownsAccount } from '../middleware/auth.js';
import { profilePhoto } from '../middleware/profilePhoto.js';

const routes = Router();

// Authentication and account registration.
routes.post('/login', UserController.login);
routes.post('/logout', authenticate, UserController.signOut);
routes.post('/signup/artists', profilePhoto, UserController.signInArtist);
routes.post('/signup/bands', profilePhoto, UserController.signInBand);
routes.post('/signup/concert-venues', profilePhoto, UserController.signInConcertVenue);

// Artist CRUD.
routes.post('/artists', profilePhoto, ArtistController.create);
routes.get('/artists', authenticate, ArtistController.list);
routes.get('/artists/:id', authenticate, ArtistController.show);
routes.patch('/artists/:id', authenticate, ownsAccount('Artista'), profilePhoto, ArtistController.update);
routes.delete('/artists/:id', authenticate, ownsAccount('Artista'), ArtistController.delete);

// Band CRUD.
routes.post('/bands', profilePhoto, BandController.create);
routes.get('/bands', authenticate, BandController.list);
routes.get('/bands/:id', authenticate, BandController.show);
routes.patch('/bands/:id', authenticate, ownsAccount('Banda'), profilePhoto, BandController.update);
routes.delete('/bands/:id', authenticate, ownsAccount('Banda'), BandController.delete);

export default routes;
