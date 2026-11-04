# Uzquiz — Savollar muharriri qo'llanmasi

Savollar muharriri yordamida o'yindagi barcha 42 ta savolni dasturlashsiz o'zgartirishingiz mumkin. Savollarni tahrirlaysiz, xatolarni tekshirasiz, o'yinda sinab ko'rasiz va bitta tugma bilan saytga nashr qilasiz.

**Manzil:** https://alokhon99.github.io/uzquiz/admin.html
(Bu sahifa o'yinda ko'rinmaydi va qidiruv tizimlariga berilmaydi.)

---

## 1. Bir martalik sozlash: GitHub token

Nashr qilish uchun GitHub «fine-grained» token kerak. U faqat Uzquiz repozitoriyasidagi fayllarni yozishga ruxsat beradi.

1. https://github.com/settings/personal-access-tokens/new sahifasini oching.
2. **Token name:** `Uzquiz muharriri`. **Expiration:** masalan, 90 kun.
3. **Repository access** → **Only select repositories** → `alokhon99/uzquiz`.
4. **Permissions** → **Repository permissions** → **Contents** → **Read and write**.
5. **Generate token** tugmasini bosing. `github_pat_…` bilan boshlanadigan tokenni nusxalang.

> 🔒 Tokenni hech kimga bermang. Muharrir uni faqat sizning brauzeringizda saqlaydi va faqat `api.github.com` manziliga yuboradi. «Shu qurilmada eslab qolish» belgilanmasa, brauzer yopilganda token o'chadi. Token yo'qolsa yoki shubha tug'ilsa, uni GitHub'da o'chirib (Revoke), yangisini yarating.

---

## 2. Muharrir ekrani

| Qism | Vazifasi |
|---|---|
| **Holat qatori** | ✓ Xato yo'q / ⛔ N ta xato, ⚠️ ogohlantirishlar, ✎ o'zgarishlar soni |
| **Raund tugmalari (1–6)** | Raundni tanlash. Qizil raqam — shu raunddagi xatolar soni |
| **Raund sozlamalari** | Belgi (emoji), nom, vaqt (5–120 soniya), rang, tavsif. 6-raundda **yashirin mavzu** ham bor |
| **Savol kartalari (7 ta)** | Rasm, savol matni, javoblar, qiziqarli fakt. ↑ ↓ — savol tartibini o'zgartirish |
| **Pastki panel** | ▶ **O'yinda sinash** va 🚀 **Nashr qilish** |

### Savolni tahrirlash
- **Variantli savollar:** 4 ta variantni yozing va to'g'ri javobni chapdagi **A / B / C / D** harfini bosib belgilang. To'g'ri variant yashil rangda ko'rinadi.
- **Yozma savollar** (3-raund va 6-raundning 7-savoli): **to'g'ri javob**ni yozing. Kerak bo'lsa, **muqobil javoblar**ni vergul bilan kiriting (masalan, `Navoiy` asosiy javob, `Alisher Navoiy` esa muqobil).
- **Rasm:** 1-raundda har bir savolga emoji rasm majburiy (🍎, 🐘…). Bayroq kabi maxsus chizmani emoji bilan almashtirish mumkin.
- **Qiziqarli fakt** ixtiyoriy. U javobdan keyin 💡 belgisi bilan ko'rsatiladi.

### Avtomatik tekshiruvlar
Muharrir har bir o'zgarishni darhol tekshiradi. Xato bo'lsa, nashr qilish tugmasi o'chadi:

| Tekshiruv | Misol |
|---|---|
| Bo'sh matn yoki variant | «Savol matni bo'sh» |
| Takrorlanuvchi variantlar | «Javob variantlari takrorlanmasligi kerak» |
| 1-raundda rasm yo'q | «1-raundda har bir savolga rasm kerak» |
| **So'z zanjiri** (3-raund) | «Javob «Z» harfi bilan boshlanishi kerak (oldingi javob — «Tarvuz»)» |
| **Yashirin mavzu** (6-raund) | 7-savol javobi yashirin mavzuga teng bo'lishi kerak |
| Mavzu oldindan ko'rinib qolishi (⚠️) | Mavzu so'zi 1–6-savollarda uchrasa, ogohlantirish chiqadi |

> 🔗 3-raundda bitta javobni o'zgartirsangiz, odatda **keyingi** savol ham o'zgarishi kerak bo'ladi. Har bir kartaning pastida keyingi javob qaysi harf bilan boshlanishi kerakligi yozilgan.

---

## 3. Qoralama

- Barcha o'zgarishlar shu brauzerda **avtomatik saqlanadi** (qoralama). Sahifani yopib, keyin qaytsangiz, ishingiz tiklanadi.
- O'zgargan savollar «• o'zgargan» belgisi bilan ko'rsatiladi.
- **«O'zgarishlarni bekor qilish»** — qoralamani o'chiradi va saytdagi versiyani qayta yuklaydi.
- **«questions.js ni yuklab olish»** — savollar faylining zaxira nusxasini kompyuterga saqlaydi.

---

## 4. O'yinda sinash

**▶ O'yinda sinash** tugmasi o'yinni yangi oynada **ko'rib chiqish rejimida** ochadi. Yuqorida sariq «Ko'rib chiqish rejimi» yozuvi bo'ladi. O'yin tanlangan raunddan boshlanadi va qoralamadagi savollarni ishlatadi.

- Bu rejimdagi natijalar haqiqiy rekordlarga **qo'shilmaydi**.
- Boshqa o'yinchilar sizning qoralamangizni **ko'rmaydi**. U faqat nashrdan keyin hammaga ko'rinadi.

---

## 5. Nashr qilish

1. Xato qolmaganiga ishonch hosil qiling (✓ Xato yo'q).
2. **🚀 Nashr qilish** tugmasini bosing.
3. Qisqa izoh yozing (masalan, «2-raund savollari yangilandi»).
4. GitHub tokenni joylashtiring. Kerak bo'lsa, **«Shu qurilmada eslab qolish»** belgisini qo'ying.
5. **Nashr qilish** tugmasini bosing. Jarayon ro'yxatda ko'rinadi:
   - ✓ Repozitoriy: alokhon99/uzquiz
   - ✓ main: saqlandi
   - ✓ gh-pages: saqlandi
6. Sayt odatda **1–10 daqiqada** yangilanadi. O'yinchilar sahifani qayta ochganda yangi savollarni ko'radi.

### Xatolar
| Xabar | Sabab va yechim |
|---|---|
| Token noto'g'ri yoki muddati tugagan | Yangi token yarating (1-bo'lim) |
| Ruxsat yo'q — «Contents: Read and write» | Tokenni tahrirlab, **Contents** uchun **Read and write** ruxsatini bering |
| Repozitoriy yoki fayl topilmadi | Tokenda `uzquiz` repozitoriyasi tanlanganini tekshiring |
| Fayl shu payt boshqa joyda o'zgartirildi | Bir necha soniyadan keyin **Qayta urinish** tugmasini bosing |

---

## 6. Dasturchilar uchun eslatma

Muharrir bitta faylni ikki branch'ga yozadi: `main` (`app/js/questions.js`) va saytni beruvchi `gh-pages` (`js/questions.js`). Har bir nashr GitHub'da alohida commit bo'lib qoladi, shuning uchun istalgan eski versiyaga qaytish mumkin. Kompyuterda kod ustida ishlashdan oldin GitHub'dagi o'zgarishlarni oling:

```bash
git pull
```
