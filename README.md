# kör nokta

polisin görmediği yerde bir suç işlendi. kurbanı ve katili saf mantıkla bul.

**oyna:** https://kerem-sahin.github.io/kor-nokta/

## kurallar

1. **polis** etrafındaki 8 kareyi görür. kurban orada olamaz, orada duran şüpheli masumdur.
2. **oklu tanık** kurbanı gösterir: kurban okun çizgisi üzerindedir (düz, yan ya da çapraz).
   **sayılı tanık** mesafeyi söyler: kurban bu tanığa tam o kadar kare uzaktadır.
3. **katil** kurbanın hemen yanındadır: kurbanın yanında, polisin görmediği tek şüpheli odur.

## dosyalar

- `index.html`: oyunun kendisi
- `cases.js`: deneme vakaları (otomatik üretildi)
- `tools/generate.js`: vaka üretici. her vakanın tek çözümü olduğunu kontrol eder. `node tools/generate.js` ile yeniden üretilir.
- `tools/serve.js`: yerel önizleme sunucusu (`node tools/serve.js`)

deneme sürümü.
