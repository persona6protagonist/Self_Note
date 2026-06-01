document.getElementById('tampil-username').textContent = 'Halo, ' + localStorage.getItem('username');
const API = 'http://localhost:3000';

function getToken() {
  return localStorage.getItem('token');
}

let transaksi = [];
let grafik = null;
ambilTransaksi();
document.getElementById('tanggal').value = new Date().toLocaleDateString('en-CA');

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

    fetch(API + '/transaksi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',
        'authorization': getToken()
       },
      body: JSON.stringify({ keterangan, jenis, jumlah, tanggal })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      console.log(data);
      ambilTransaksi();
      bersihkanForm();
    });
}

function simpanKeStorage(){
  localStorage.setItem('transaksi',JSON.stringify(transaksi));
}

function tampilkanTransaksi(data = transaksi){
    const tbody = document.getElementById('tabel-transaksi');
    tbody.innerHTML='';

    if(data.length == 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#888;">Belum ada transaksi</td></tr>'
      return;
    }

    data.forEach(function(item){
        const row = document.createElement('tr');
        row.innerHTML = `
        <td>${formatTanggal(item.tanggal)}</td>
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
      totalMasuk += Number(item.jumlah);
    } else {
      totalKeluar += Number(item.jumlah);
    }
  });

  const saldo = totalMasuk - totalKeluar;

  document.getElementById('total-masuk').textContent = 'Rp ' + totalMasuk.toLocaleString('id-ID');
  document.getElementById('total-keluar').textContent = 'Rp ' + totalKeluar.toLocaleString('id-ID');
  document.getElementById('saldo').textContent = 'Rp ' + saldo.toLocaleString('id-ID');
}

function hapusTransaksi(id) {
  // Filter: simpan semua kecuali yang id-nya sama
  if (!confirm('Yakin Hapus?')) return;

      fetch(API + '/transaksi/' + id, {
        method: 'DELETE',
        headers: { 'authorization': getToken() }
    })
    .then(function(res) { return res.json(); })
    .then(function() {
        ambilTransaksi();
  });
}



function tampilkanGrafik(data = transaksi){
  const bulanan = {};

  data.forEach(function(item){
    const bulan = item.tanggal.slice(0, 7);

    if (!bulanan[bulan]){
      bulanan[bulan] = { masuk: 0, keluar: 0};
    }

    if (item.jenis === 'masuk'){
      bulanan[bulan].masuk += Number(item.jumlah);
    }else {
      bulanan[bulan].keluar += Number(item.jumlah);
    }
  });

  if (Object.keys(bulanan).length === 0) {
    if (grafik) grafik.destroy();
    grafik = null;
    document.getElementById('card-grafik').style.display = 'none';
    return;
  }
document.getElementById('card-grafik').style.display = 'block';

const labels = Object.keys(bulanan).sort();
const dataMasuk = labels.map(b => bulanan[b].masuk);
const dataKeluar = labels.map(b => bulanan[b].keluar);

const ctx = document.getElementById('grafikKeuangan').getContext('2d');

if (grafik) grafik.destroy();

grafik = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: labels,
    datasets: [
      {
        label: 'Pemasukan',
        data: dataMasuk,
        backgroundColor: '#1D9E75'
      },
      {
        label: 'Pengeluaran',
        data: dataKeluar,
        backgroundColor: '#D85A30'
      }
    ]
  },
  options:{
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});
}

function bersihkanForm() {
  document.getElementById('keterangan').value = '';
  document.getElementById('jumlah').value = '';
  document.getElementById('tanggal').value = new Date().toLocaleDateString('en-CA');
}

function eksportCSV(){
  if (transaksi.length === 0){
    alert('Data Masih Kosong');
    return;
  }

  let csv = 'Tanggal,Keterangan,Jenis,Jumlah\n';

  transaksi.forEach(function(item){
    const jenis = item.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran';
    csv += `"\t${item.tanggal}",${item.keterangan},${jenis},${item.jumlah}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transaksi.csv';
  a.click();

  URL.revokeObjectURL(url);
}
function ambilTransaksi() {
    fetch(API + '/transaksi', {
      headers: {'authorization': getToken() }
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.error) {
        window.location.href = 'kicau_login.html';
        return;
      }
        transaksi = data;
        tampilkanTransaksi();
        hitungSaldo();
        tampilkanGrafik();
        isiFilterBulan();
    });
}
function formatTanggal(tanggal) {
    return tanggal.slice(0, 10);
}
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  window.location.href = 'kicau_login.html';
}

function isiFilterBulan() {
  const select = document.getElementById('filter-bulan');
  const bulanADA = [...new Set(transaksi.map(item => item.tanggal.slice(0, 7)))].sort();


  select.innerHTML = '<option value=semua>Semua Bulan</option>';

  bulanADA.forEach(function(bulan) {
    const option = document.createElement('option');
    option.value = bulan;
    option.textContent = formatNamaBulan(bulan);
    select.appendChild(option);
  });
}

function formatNamaBulan(bulan) {
  const [tahun, bln] = bulan.split('-');
  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April',
    'Mei', 'Juni', 'Juli', 'Agustus',
    'September', 'Oktober', 'November', 'Desember'
  ];
  return namaBulan[Number(bln) - 1] + ' ' + tahun;
}

function filterBulan() {
  const bulan = document.getElementById('filter-bulan').value;
  if (bulan === 'semua') {
    tampilkanTransaksi(transaksi);
    tampilkanGrafik(transaksi);
  } else {
    const hasil = transaksi.filter(item => item.tanggal.slice(0, 7) == bulan);
    tampilkanTransaksi(hasil);
    tampilkanGrafik(hasil);
  }
}
