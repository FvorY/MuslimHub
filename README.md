# MuslimHub

MuslimHub adalah platform digital yang dirancang untuk memenuhi kebutuhan informasi dan layanan bagi umat Muslim. Project ini bertujuan untuk menyediakan akses mudah ke jadwal sholat, arah kiblat, konten islami, dan fitur-fitur lainnya yang relevan dengan kehidupan Muslim modern.

## Deploy iOS (Capacitor)

Prerequisite:
- Xcode terpasang di macOS
- CocoaPods terpasang

Langkah:
1. Install dependency:
   `npm install`
2. Build web:
   `npm run build`
3. Tambahkan platform iOS (sekali saja):
   `npm run ios:add`
4. Sinkronkan perubahan web/plugin ke iOS:
   `npm run ios:sync`
5. Buka project di Xcode:
   `npm run ios:open`

Jika sudah pernah add iOS, cukup ulangi langkah 2, 4, dan 5 saat akan update build.
