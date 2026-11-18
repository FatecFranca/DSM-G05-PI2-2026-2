import { accountHandlers } from './AccountController.js';

const handlers = accountHandlers('Banda');

export default class BandController {
    static create = handlers.create;
    static list = handlers.list;
    static show = handlers.show;
    static update = handlers.update;
    static delete = handlers.delete;
}
