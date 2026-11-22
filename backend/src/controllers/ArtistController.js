import { accountHandlers } from './AccountController.js';

const handlers = accountHandlers('Artista');

export default class ArtistController {
    static create = handlers.create;
    static list = handlers.list;
    static show = handlers.show;
    static update = handlers.update;
    static delete = handlers.delete;
}
