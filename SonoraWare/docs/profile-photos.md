# Profile photos

Send a `multipart/form-data` request with one file named `foto_perfil`.
PNG, JPEG, GIF and WebP signatures are accepted, up to 5 MiB. Signature checks
identify the format; they do not fully decode or verify the image contents.
Multer keeps the file in memory as a Buffer, and mysql2 saves that Buffer directly
in the MEDIUMBLOB column. No upload directory is needed.

Supported endpoints:

- POST `/signup/artists`, `/signup/bands`, `/signup/concert-venues`
- POST `/artists`, `/bands`
- PATCH `/artists/:id`, `/bands/:id` (requires the account owner's Bearer token)

```js
const form = new FormData();
form.set('nome', 'Ana');
form.set('email', 'ana@example.com');
form.set('senha', 'your-password');
form.set('instrumentos', JSON.stringify([1, 2]));
form.set('foto_perfil', document.querySelector('input[type="file"]').files[0]);

const response = await fetch('/signup/artists', {
    method: 'POST',
    body: form,
});
```

Let the browser set Content-Type so it includes the multipart boundary.
Send relationship arrays as JSON strings, numbers as decimal strings, and
`possui_instrumentos` as `true` or `false`. Existing JSON requests without an
image still work. Image URL strings are no longer accepted.

Omitting `foto_perfil` during an update preserves the current photo. Sending
`{ "foto_perfil": null }` as JSON, or the text `null` in a multipart form, removes it.
Artist and band list/detail responses return `foto_perfil` as a data URL or null:

```js
imageElement.src = account.foto_perfil;
```

Data URLs make displaying images simple but increase response size, especially
in lists. The existing venue API supports registration only; no venue edit or
read routes are added here.

The database must already have the MEDIUMBLOB columns defined in
`src/database/init.sql`. Editing that file does not modify existing tables.
