const express = require("express");
const cors = require('cors');
const mysql = require('mysql2');
const axios = require('axios');
const multer = require('multer');
const moment = require('moment/moment.js');
const uuid = require('uuid');

// CREATE CONNECTION TO DATABASE
const pool = mysql.createPool({
  host: 'localhost',
  // user: 'xxx',
  user: 'root',
  // password: 'xxx',
  database: 'dbtest',
  port: 3306,
});

const dbconn = pool.promise();

// MULTER UPLOAD NONE CONFIGURATION
const uploadNone = multer();

// EXPRESS JS CONFIGURATION
const app = express()
app.use(cors());

// MIDDLEWARE
app.use(express.json());


app.post('/test/storebarang', uploadNone.none(), async (req, res) => {
  let dataBarang = JSON.parse(req.body.data);

  try {

    const getUraian = await axios.get(`https://insw-dev.ilcs.co.id/my/n/barang?hs_code=${dataBarang.kode_barang}`);
    const getBiaya = await axios.get(`https://insw-dev.ilcs.co.id/my/n/tarif?hs_code=${dataBarang.kode_barang}`);

    const dataUraian = getUraian.data.data[0];
    const dataBiaya = getBiaya.data.data[0];

    // Continue with your database insertion logic
    let addData = await dbconn.query(`INSERT INTO sim_import (id_simulasi, kode_barang, uraian_barang, bm, nilai_komoditas, nilai_bm, waktu_insert) VALUES (?,?,?,?,?,?,?)`, [
      uuid.v4(),
      dataBarang.kode_barang,
      dataUraian.sub_header + " " + dataUraian.uraian_id,
      parseInt(dataBiaya.bm),
      dataBarang.nilai_komoditas,
      ((parseInt(dataBarang.nilai_komoditas) * parseInt(dataBiaya.bm)) / 100),
      moment().format()
    ]);

    res.status(200).json({
      success: 'true',
      message: 'Berhasil menambah data',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(400).json({
      status: 'error',
      message: 'Failed to connect with the external API or database, please try again.'
    });
    return;
  }
});



app.listen(3001, function () {
  console.log("Started application on port %d", 3001)
});