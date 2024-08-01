const Listing = require("../models/listing");
const axios = require('axios');

module.exports.index = async (req,res) => {
    const allListings = await  Listing.find({});
    res.render("listings/index.ejs", {allListings});
  };

 module.exports.renderNewForm = (req,res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing =  async (req,res) => {
  let {id} = req.params;
  const listing = await Listing.findById(id).populate({path: "reviews", populate:{
    path: "author",
  },
  })
  .populate("owner");
    if(!listing) {
      req.flash("error", " Listing you requested for does not exist!");
      res.redirect("/listings")
    }
    console.log(listing);
    res.render("listings/show.ejs",{listing, coordinates: listing.coordinates});
};

module.exports.createListing = async (req,res, next) => { 

  let {location} = req.body.listing;
  let geocodeUrl = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(location)}&apiKey=${process.env.MAP_API_KEY}`;

  let response;

    try {
        response = await axios.get(geocodeUrl);
    } catch (error) {
        console.error("Error fetching geocode data: ", error);
        req.flash("error", "Error fetching location data");
        return res.redirect("/listings/new");
    }
 
    let coordinates = response.data.items.length > 0 ? response.data.items[0].position : { lat: 0, lng: 0 };

  let url = req.file.path;
  let filename = req.file.filename;
 
  const  newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = {url, filename};
  newListing.coordinates = coordinates;
  await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect("/listings"); 
};

module.exports.renderEditForm = async (req,res) => {
  let {id} = req.params;
  const listing = await Listing.findById(id);
  if(!listing) {
      req.flash("error", " Listing you requested for does not exist!");
      res.redirect("/listings")
    }

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250"); 
  res.render("listings/edit.ejs", { listing,originalImageUrl });
};

module.exports.updateListing = async (req,res) => {
  let { id } = req.params;
  let listing = await  Listing.findByIdAndUpdate(id, {... req.body.listing});

  if(typeof req.file !== "undefined") {
  let url = req.file.path;
  let filename = req.file.filename;
  listing.image = { url, filename };
  await listing.save();
  }
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req,res) => {
  let {id}  = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};