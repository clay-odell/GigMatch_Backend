require('dotenv').config();
const app = require('./app');
const port = process.env.PORT || 3000;
console.log(port);

app.get('/', (req, res) => {
  res.send('Welcome to the GigMatch Server');
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
