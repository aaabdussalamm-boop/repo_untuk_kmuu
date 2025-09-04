# Tap 40 + Flappy — Mini Games

Dua game berurutan di web: **Tap 40 kali** secepatnya lalu **Flappy Friend** bergaya Flappy Bird.
- Tema **latar belakang putih** (white palette).
- Musik latar: pengguna meletakkan file **`assets/kita.mp3`** (Sheila On 7 — *Kita*) milik sendiri. File audio **tidak disertakan**.
- Masa aktif: **65 hari** mulai **2025-09-04** hingga **2025-11-08** (lokal klien).

## Struktur
```
/
├─ index.html
├─ style.css
├─ app.js
├─ assets/
│   ├─ icon.png
│   └─ click.mp3 (opsional)
└─ README.md
```

## Cara Main
1. Isi nama, klik **Mulai Game 1** (musik latar akan dicoba diputar).
2. **Game 1 — Tap 40**: tap sampai 40, timer mulai di tap pertama.
3. Otomatis lanjut ke **Game 2 — Flappy**: klik/tap untuk terbang. Capai skor target (default 10) untuk menang.
4. Setelah menamatkan keduanya, muncul layar **Selesai!** dengan ucapan dan ringkasan skor.

## Musik Latar
- Letakkan file **`assets/kita.mp3`** (milik Anda sendiri) agar musik diputar loop di sepanjang permainan.
- Tombol **🔊 Musik** di header untuk mute/unmute.
- Karena kebijakan autoplay browser, musik baru bisa diputar setelah interaksi pertama.

## Deploy ke GitHub Pages
1. Buat repo publik, upload semua file.
2. Settings → Pages → Source: *Deploy from a branch* → branch `main` root `/` → Save.
3. Akses URL `https://<username>.github.io/<repo>/`.

## Ubah Target Flappy / Tanggal Kadaluarsa
- Ubah `GOAL_PIPES` di `app.js` untuk tingkat kesulitan.
- Ubah tanggal di:
```js
const START_DATE_ISO = "2025-09-04";
const EXPIRE_DATE_ISO = "2025-11-08";
```

Selamat bermain!
