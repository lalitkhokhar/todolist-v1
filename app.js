const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

//ejs from ejs.co (embeded Javascript)
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://", { useNewUrlParser: true });

const itemsSchema = {
    name: String
};

const Item = mongoose.model("item", itemsSchema);

const item1 = new Item({
    name: "Welcome to  your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];


const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("list", listSchema);


app.get("/", function (req, res) {

    Item.find({}, (err, items) => {

        if (items.length === 0) {
            Item.insertMany(defaultItems, (err) => {
                if (err) {
                    console.log(err);
                } else { console.log("Successfully saved default items to database.") }
            });
            res.redirect("/");
        } else {
            //sends values to ejs page
            res.render("list", { listTitle: "Today", newListItems: items });
        }
    });

});

//Cathes the post data
app.post("/", function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    //check if the add button is clicked on default list or custom list
    if (listName === "Today") {
        Item.create({ name: itemName }, (err, itemName) => {
            if (err) return handleError(err);
        });
    
        res.redirect("/");
    } else {
        List.findOne({name: listName}, (err, foundList) => {
            const item = new Item ({ name: itemName });
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    };
});

app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today"){
        Item.findByIdAndRemove(checkedItemId, (err) => {
            if (!err) {
                console.log("Successfully deleted checked item.");
            }
        });
        res.redirect("/");
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
            if(!err) {
                res.redirect("/" + listName);
            }
        });
    };
});


app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, (err, foundList) => {
        if (!err) {
            if (!foundList) {
                //create a new list
                List.create({ name: customListName, items: defaultItems });
                res.redirect("/" + customListName);
            } else {
                //show an existing list
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        };
    });
});



let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function () {
    console.log("Server started on port 3000");
});
