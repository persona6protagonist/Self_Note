let transaksi = JSON.parse(localStorage.getItem('transaksi')) || [];

tampilkanTransaksi();
hitungSaldo();

document.getElementById('jumlah').addEventListener('input', function() {
    // Simpan posisi kursor
    let nilai = this.value.replace(/[^0-9]/g, ''); // hanya ambil angka murni
    
    if (nilai === '') {
        this.value = '';
        return;
    }

    this.value = formatRupiah(Number(nilai));
});

function formatRupiah(angka) {
  return angka.toLocaleString('id-ID');
}

function tambahTransaksi() {
    const keterangan = document.getElementById('keterangan').value;
    const jumlah = Number(document.getElementById('jumlah').value.replace(/[^0-9]/g, ''));
    const jenis = document.getElementById('jenis').value;
    const tanggal = document.getElementById('tanggal').value;

    if(!keterangan || !jumlah || !tanggal){
        alert('Harap Diisi');
        return;
    }

    const data = {
        id: Date.now(),
        keterangan,
        jumlah,
        jenis,
        tanggal
    };

    transaksi.push(data);
    simpanKeStorage();
    tampilkanTransaksi();
    hitungSaldo();
    bersihkanForm();
}

function simpanKeStorage(){
  localStorage.setItem('transaksi',JSON.stringify(transaksi));
}

function tampilkanTransaksi(){
    const tbody = document.getElementById('tabel-transaksi');
    tbody.innerHTML='';

    transaksi.forEach(function(item){
        const row = document.createElement('tr');
        row.innerHTML = `
        <td>${item.tanggal}</td>
        <td>${item.keterangan}</td>
        <td>
            <span class="badge ${item.jenis === 'masuk' ? 'badge-in' : 'badge-out'} ">
                ${item.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}
            </span>
        </td>
        <td class="${item.jenis === 'masuk' ? 'income' : 'expense'}">
        ${item.jenis === 'masuk' ? '+' : '-'} Rp ${item.jumlah.toLocaleString('id-ID')}
        </td>
        <td>
            <button onclick="hapusTransaksi(${item.id})">Hapus</button>
        </td>
        `;
        tbody.appendChild(row);

    });
}

function hitungSaldo() {
  let totalMasuk = 0;
  let totalKeluar = 0;

  transaksi.forEach(function(item) {
    if (item.jenis === 'masuk') {
      totalMasuk += item.jumlah;
    } else {
      totalKeluar += item.jumlah;
    }
  });

  const saldo = totalMasuk - totalKeluar;

  document.getElementById('total-masuk').textContent = 'Rp ' + totalMasuk.toLocaleString('id-ID');
  document.getElementById('total-keluar').textContent = 'Rp ' + totalKeluar.toLocaleString('id-ID');
  document.getElementById('saldo').textContent = 'Rp ' + saldo.toLocaleString('id-ID');
}

function hapusTransaksi(id) {
  // Filter: simpan semua kecuali yang id-nya sama
  transaksi = transaksi.filter(function(item) {
    return item.id !== id;
  });

  simpanKeStorage();
  tampilkanTransaksi();
  hitungSaldo();
}

function bersihkanForm() {
  document.getElementById('keterangan').value = '';
  document.getElementById('jumlah').value = '';
  document.getElementById('tanggal').value = '';
}