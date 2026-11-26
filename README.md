# kör nokta

polisin görmediği yerde bir gecede birden çok cinayet işlendi. kurbanları ve katilleri saf mantıkla bul.

**oyna:** https://kerem-sahin.github.io/kor-nokta/

## kurallar

bu gece birden çok cinayet işlendi. bütün kurbanları bul; katiller kurbanlardan çıkar.

1. **polis** etrafındaki 8 kareyi görür. kurban orada olamaz, orada duran şüpheli masumdur. polisin görmediği yerler karanlıktır.
2. **katil** kurbanının hemen yanındadır. her kurbanın yanında karanlıkta tek bir şüpheli durur: katili. her katil tek kişiyi öldürdü.
3. **gören tanık (ok):** okun çizgisinde, tahtanın sonuna kadar tam bir katil var.
   **duyan tanık (sayı):** en yakın kurban tam o kadar kare uzakta, daha yakında kurban yok (çapraz adım da 1).

kurbanlar boş karelerdedir; kaç kurban olduğu vakada yazar.

## dosyalar

- `index.html`: oyunun kendisi
- `cases.js`: deneme vakaları (otomatik üretildi)
- `tools/generate.js`: vaka üretici. her vakanın tek çözümü olduğunu ve tahmin etmeden, adım adım mantıkla çözülebildiğini kontrol eder; zorluğu çözücünün kaç kez "varsayalım ki" demesi gerektiğiyle ölçer. `node tools/generate.js` ile yeniden üretilir.
- `tools/serve.js`: yerel önizleme sunucusu (`node tools/serve.js`)

deneme sürümü.
