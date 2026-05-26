CREATE DATABASE keuangan;

CREATE TABLE transaksi (
id INT AUTO_INCREMENT PRIMARY KEY,
keterangan VARCHAR(225),
jenis VARCHAR(10),
jumlah DECIMAL(15,2),
tanggal date
);