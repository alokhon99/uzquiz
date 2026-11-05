# Uzquiz — Paketlar muharriri qo'llanmasi (2.0)

Muharrir yordamida jamoangiz dasturlashsiz yangi savollar paketlarini yaratadi, savollarga rasm, tovush va video qo'shadi, o'yinda sinab ko'radi va saytga nashr qiladi.

**Manzil:** https://alokhon99.github.io/uzquiz/admin.html
(O'yinda bu sahifaga havola yo'q va u qidiruv tizimlariga berilmaydi.)

---

## 1. Bir martalik sozlash: GitHub token

Saqlash va nashr qilish uchun GitHub «fine-grained» token kerak:

1. https://github.com/settings/personal-access-tokens/new sahifasini oching.
2. **Token name:** `Uzquiz muharriri`. **Expiration:** masalan, 90 kun.
3. **Repository access** → **Only select repositories** → `alokhon99/uzquiz`.
4. **Permissions** → **Contents** → **Read and write**.
5. **Generate token** tugmasini bosing va `github_pat_…` bilan boshlanadigan tokenni nusxalang.

> 🔒 Token faqat sizning brauzeringizda saqlanadi va faqat `api.github.com` ga yuboriladi. Uni hech kimga bermang. Shubha tug'ilsa, GitHub'da tokenni o'chirib (Revoke), yangisini yarating.

---

## 2. Paketlar ro'yxati

Muharrir ochilganda barcha paketlar ko'rinadi:

| Holat | Ma'nosi |
|---|---|
| **Qoralama** | Ishlanmoqda. O'yinchilarga ko'rinmaydi |
| **Ko'rib chiqishda** | Tayyor, egasi tasdiqlashi kutilmoqda. O'yinchilarga ko'rinmaydi |
| **Nashr qilingan** | Katalogda, o'yinchilarga ko'rinadi |
| **Arxiv** | Katalogdan yashirilgan |
| ✎ **Saqlanmagan** | Shu qurilmada saqlanmagan o'zgarishlar bor |
| **Faqat shu qurilmada** | Yangi paket, hali GitHub'ga saqlanmagan |

**＋ Yangi paket** → nomini yozing. ID (havola uchun) avtomatik taklif qilinadi. ID'ni keyin o'zgartirib bo'lmaydi.

---

## 3. Paketni tahrirlash

Yuqoridagi yorliqlar: **📦 Paket**, raundlar (**1. …**, **2. …**) va **＋ Raund**. Qizil raqam — o'sha qismdagi xatolar soni.

### 📦 Paket yorlig'i
- Nomi, toifa, tavsif (katalogda ko'rinadi), yosh chegarasi (0+, 6+, 12+, 16+).
- **Tezlik bonusi** — tez javob uchun +5 gacha ochko.
- **To'g'ri javobni ko'rsatish** — xato javobdan keyin to'g'ri javob ko'rsatilsinmi.
- **Muqova** — emoji yoki rasm.
- **📄 Nusxa olish** — paketdan yangi ID bilan nusxa yaratadi (media fayllari bilan birga).
- **↩️ Qoralamani bekor qilish** — saqlanmagan o'zgarishlarni o'chiradi.

### Raund yorlig'i
- Belgi, nom, vaqt (5–120 soniya), rang, tavsif va to'g'ri javob uchun ochko (1–100).
- **Raund turi:**
  - **Oddiy** — har qanday savollar.
  - **So'z zanjiri** — barcha savollar yozma javobli. Keyingi javob oldingi javobning oxirgi harfi bilan boshlanishi kerak.
  - **Yashirin mavzu** — **yashirin mavzu** maydoni paydo bo'ladi. Oxirgi savol («Yakuniy») mavzuning o'zini so'raydi va uning javobi mavzuga teng bo'lishi kerak.
- **← Avvalga / Keyinga →** — raund tartibini o'zgartirish. **🗑️ Raundni o'chirish** — raundni o'chirish.
- Paketda 1–10 raund, har bir raundda 1–20 savol bo'ladi.

### Savollar
- Qo'shish: **＋ Variantli**, **＋ Ha / Yo'q**, **＋ Yozma**. Savol turini kartadagi ro'yxatdan ham o'zgartirish mumkin.
- **Variantli:** 2–6 ta variant. To'g'ri variantni chapdagi harf bilan belgilang. Variantni **＋ Variant qo'shish** yoki ✕ bilan qo'shish va o'chirish mumkin.
- **Ha / Yo'q:** to'g'ri javobni belgilang.
- **Yozma:** to'g'ri javob va vergul bilan ajratilgan muqobil javoblar (masalan, `Navoiy` asosiy, `Alisher Navoiy` muqobil).
- ↑ ↓ — tartibni o'zgartirish, 🗑️ — o'chirish.
- **Qiziqarli fakt** — javobdan keyin 💡 bilan ko'rsatiladi.

---

## 4. Media qo'shish

Har bir savolda ikkita media joyi bor:
- **📎 Savol mediasi** — savol bilan birga ko'rsatiladi;
- **✨ Javobdan keyingi media** — javobdan keyin ochiladi (masalan, to'liq rasm yoki qo'shiq naqarotidan parcha).

Media turini tanlang (**Yo'q / Emoji / Rasm / Audio / Video**), so'ng **📁 Fayl tanlash** tugmasini bosing:

| Tur | Formatlar | Cheklov | Avtomatik |
|---|---|---|---|
| 🖼️ Rasm | JPG, PNG, WebP | 5 MB | WebP formatiga o'giriladi, eng ko'pi bilan 1280 px |
| 🎵 Audio | MP3, M4A, OGG, WAV | 60 soniya, 5 MB | — |
| 🎬 Video | MP4 (H.264), WebM | 60 soniya, 30 MB | — |

- **Tavsif (alt matn)** — rasm va video uchun majburiy (ko'zi ojiz o'yinchilar uchun).
- **Boshlanish / Tugash (s)** — audio yoki videoning faqat bir qismini ijro etish uchun.
- **Qayta ijro** — o'yinchi necha marta qayta tinglay yoki ko'ra olishi (0–5, odatda 1).
- **Huquq ma'lumoti (majburiy):** manba, litsenziya (O'zimizniki, Litsenziyalangan, Jamoat mulki, Creative Commons) va huquq egasi.

> ⚖️ **Muhim:** film va qo'shiqlardan olingan qisqa parchalar ham mualliflik huquqi bilan himoyalangan. Faqat o'zingiz tayyorlagan, litsenziyasi bor yoki jamoat mulki bo'lgan media'dan foydalaning. Pullik paketlarni sotishdan oldin yurist bilan maslahatlashing.

Yuklangan fayllar nashrgacha **faqat shu brauzerda** saqlanadi. Kartada «hali nashr qilinmagan» deb yoziladi.

---

## 5. Avtomatik tekshiruvlar

Muharrir har bir o'zgarishni darhol tekshiradi:
- bo'sh matn yoki variant, takrorlanuvchi variantlar, belgilanmagan to'g'ri javob;
- variantlar soni (2–6), raund va savollar soni chegaralari, vaqt va ochko;
- media: fayl tanlanmagan, alt matn yo'q, huquq ma'lumoti to'ldirilmagan, noto'g'ri qism vaqtlari;
- so'z zanjiri buzilgan (qaysi harf kerakligi yoziladi);
- yashirin mavzu: yakuniy javob mavzuga teng emas; ⚠️ mavzu oldingi savollarda ko'rinib qolgan.

Xato bo'lsa, paketni **«Nashr qilingan»** yoki **«Ko'rib chiqishda»** holatida saqlab bo'lmaydi. Lekin **«Qoralama»** sifatida saqlash mumkin.

---

## 6. ▶ Sinash

**▶ Sinash** tugmasi o'yinni yangi oynada **ko'rib chiqish rejimida** ochadi. Yuqorida sariq yozuv bo'ladi va o'yin tanlangan raunddan boshlanadi. Bu rejimda hali nashr qilinmagan rasm, tovush va videolar ham ishlaydi. Natijalar haqiqiy rekordlarga qo'shilmaydi, o'yinchilar esa qoralamani ko'rmaydi.

---

## 7. 🚀 Saqlash va nashr qilish

1. **🚀 Saqlash** tugmasini bosing.
2. **Holat**ni tanlang: Qoralama, Ko'rib chiqishda, Nashr qilingan yoki Arxiv.
3. Qisqa izoh yozing va GitHub tokenni joylashtiring.
4. **Saqlash** tugmasini bosing. Jarayon ro'yxatda ko'rinadi: fayllar yuklanadi → `main` saqlandi → `gh-pages` saqlandi.
5. «Nashr qilingan» paket saytda odatda **1–10 daqiqada** paydo bo'ladi.

Bitta saqlash GitHub'da bitta commit bo'ladi (paket fayli, yangi media va katalog). Har bir versiya tarixda qoladi, shuning uchun istalgan eski holatga qaytish mumkin.

### Xatolar
| Xabar | Yechim |
|---|---|
| Token noto'g'ri yoki muddati tugagan | Yangi token yarating (1-bo'lim) |
| Ruxsat yo'q — «Contents: Read and write» | Tokenga Contents uchun Read and write ruxsatini bering |
| Repozitoriy topilmadi | Tokenda `uzquiz` repozitoriyasi tanlanganini tekshiring |
| Repozitoriy shu payt boshqa joyda o'zgardi | Bir oz kutib, **Qayta urinish** tugmasini bosing |
| Fayl topilmadi — uni qayta yuklang | Brauzer ma'lumotlari tozalangan. Faylni qayta tanlang |

---

## 8. Dasturchilar uchun eslatma

- Paketlar `app/packs/<id>/pack.json`, media fayllar `app/packs/<id>/media/`, katalog esa `app/packs/index.json` faylida saqlanadi. Muharrir bir xil faylni `main` va `gh-pages` branch'lariga yozadi.
- Kod ustida ishlashdan oldin GitHub'dagi o'zgarishlarni oling:

```bash
git pull
```
