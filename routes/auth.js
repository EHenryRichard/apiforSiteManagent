// BASIC ROUTES FOR OUR REQUESTS
import express from 'express';
const router = express.Router();

//ROUTES FOR THE GET REQUEST

//ROUTE FOR GET WITHOUT AN ID
router.get('/user', (req, res) => {
  res.json({
    message: 'this is a GET request without an id',
  });
});

//ROUTE FOR GET WITH AN ID
router.get('/user/:id', (req, res) => {
  res.json({
    message: 'this is a GET request with an id',
  });
});

//ROUTE FOR POST

router.post('/user', (req, res) => {
  res.json({
    message: 'this is post request',
    data: req.body,
  });
});

//ROUTE FOR PATCH
router.patch('/user/:id', (req, res) => {
  res.json({
    message: 'this is a patch request with an id',
  });
});

//ROUTE FOR PUT

router.put('/user', (req, res) => {
  res.json({
    message: 'this is a put request',
  });
});

//ROUTES FOR DELETE

//ROUTE FOR DELETE WITHOUT AN ID
router.delete('/user', (req, res) => {
  res.json({
    message: 'this is a delete request without an id',
  });
});

//ROUTE FOR DELETE WITH AN ID
router.delete('/user/:id', (req, res) => {
  res.json({
    message: 'this is a delete request with an id',
  });
});
export default router;
