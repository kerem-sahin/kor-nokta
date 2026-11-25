# kör nokta

polisin görmediği yerde bir suç işlendi. kurbanı ve katili saf mantıkla bul.

**oyna:** https://kerem-sahin.github.io/kor-nokta/

## kurallar

1. **polis** etrafındaki 8 kareyi görür. kurban orada olamaz, orada duran şüpheli masumdur.
2. **gören tanık (ok)** katili gördü ama yüzünü seçemedi: katil, okun çizgisi üzerindeki şüphelilerden biridir (düz, yan ya da çapraz). en yakındaki olmak zorunda değil.
   **duyan tanık (sayı)** çığlığı duydu: kurban bu tanığa tam o kadar kare uzaktadır.
3. **katil** kurbanın hemen yanındadır. kurbanın yanında polisin görmediği başka şüpheli yoktur.

## dosyalar

- `index.html`: oyunun kendisi
- `cases.js`: deneme vakaları (otomatik üretildi)
- `tools/generate.js`: vaka üretici. her vakanın tek çözümü olduğunu ve hiçbir ipucunun tek başına yetmediğini kontrol eder. `node tools/generate.js` ile yeniden üretilir.
- `tools/serve.js`: yerel önizleme sunucusu (`node tools/serve.js`)

deneme sürümü.
