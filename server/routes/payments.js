const express = require('express');

module.exports = (pool, upload) => {
  const router = express.Router();


  router.post('/', upload.single('photo'), async (req, res) => {
    try {
      const { date, amount } = req.body;
      const photo = req.file;
      
      if (!date || !amount || !photo) {
        return res.status(400).json({ error: 'Missing required fields' });
      }


      const result = await pool.query(
        'INSERT INTO payments (payment_date, amount, photo_path, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [new Date(date), parseFloat(amount), photo.path, 'not pay']
      );


      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


  router.get('/', async (req, res) => {
    try {
      const result = await pool.query('SELECT amount, status FROM payments');
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


  return router;
};