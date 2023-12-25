import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;
const API_URL = "https://covers.openlibrary.org/b";

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "library",
  password: "As38763",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs'); 


app.get("/", async (req, res) => {
    try {
        let sortQuery = "ORDER BY rating ASC"; // Default sorting by rating

        const sortBy = req.query.sort;
        if (sortBy === "date") {
            sortQuery = "ORDER BY date ASC"; // Sort by date
        } else if (sortBy === "rating") {
            sortQuery = "ORDER BY rating ASC"; // Sort by rating
        }

        const result = await db.query(`SELECT * FROM books ${sortQuery}`);
        const booksRead = result.rows;

        const booksWithCovers = await Promise.all(
            booksRead.map(async (book) => {
                try {
                    const coverUrl = `${API_URL}/isbn/${book.isbn}-M.jpg`;
                    return { ...book, cover: coverUrl };
                } catch (error) {
                    return { ...book, cover: null };
                }
            })
        );

        res.render("index.ejs", {
            books: booksWithCovers,
            listTitle: "Your List Title"
        });
    } catch (err) {
        console.log(err);
    }
});
  
  app.post("/create", async (req, res) => {
    const { newBookISBN, newBookTitle, newBookDate, newBookRating, newBookSummary } = req.body;
  
    try {
      await db.query("INSERT INTO books (isbn, title, date, rating, summary) VALUES ($1, $2, $3, $4, $5)", [
        newBookISBN,
        newBookTitle,
        newBookDate,
        newBookRating,
        newBookSummary,
      ]);
  
      res.redirect("/");
    } catch (err) {
      console.log(err);
      res.status(500).send("Error creating book");
    }
  });
  
  app.post("/update", async (req, res) => {
    const { updatedBookTitle, updatedBookISBN } = req.body;
  
    try {
      await db.query("UPDATE books SET title = ($1) WHERE isbn = $2", [updatedBookTitle, updatedBookISBN]);
      res.redirect("/");
    } catch (err) {
      console.log(err);
      res.status(500).send("Error updating book");
    }
  });
  
  app.post("/delete", async (req, res) => {
    const { deleteBookISBN } = req.body;
  
    try {
      await db.query("DELETE FROM books WHERE isbn = $1", [deleteBookISBN]);
      res.redirect("/");
    } catch (err) {
      console.log(err);
      res.status(500).send("Error deleting book");
    }
  });

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });