const express = require('express'),
    bodyParser = require('body-parser');
const authenticate = require('../authenticate');

const cors = require('./cors');

const Favorites = require('../models/favorite');
const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());


favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user:req.user._id})
        .populate('user')
        .populate('dishes')
        .exec((err, favorites) => {
            if (err) return next(err);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorites);
        });
})
.post(cors.corsWithOptions, authenticate.verifyUser, 
    (req, res, next) => {
        Favorites.findOne({ user: req.user._id }, (err, favorite) => {
            if (err) return err;

            if (!favorite) {
                Favorites.create({ user: req.user._id })
                .then((favorite) => {
                    for (let i = 0; i < req.body.length; i++) {
                        if (favorite.dishes.indexOf(req.body[i]._id) == -1) {
                            favorite.dishes.push(req.body[i]._id);
                        }
                    }
                    favorite.save()
                    .then((favorite) => {
                        Favorites.findById(favorite._id)
                        .populate('user')
                        .populate('dishes')
                        .then((favorite) => {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(favorite);
                            console.log("Favorites Created");
                        });
                    })
                    .catch((err) => next(err));
                })
                .catch((err) => next(err));
            }
            else {
                for (let i = 0; i < req.body.length; i++) {
                    if (favorite.dishes.indexOf(req.body[i]._id) == -1) {
                        favorite.dishes.push(req.body[i]._id);
                    }
                }
                favorite.save()
                .then((favorite) => {
                    Favorites.findById(favorite._id)
                    .populate('user')
                    .populate('dishes')
                    .then((favorite) => {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(favorite);
                        console.log("Favorites Created");
                    });
                })
                .catch((err) => next(err));
            }
        })
    }
)

.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/plain");
    res.end('PUT operation is not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOneAndRemove({ user: req.user._id }, (err, resp) => {
        if (err) return err;

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(resp);
    });
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorites) => {
        if (!favorites) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({"exists": false, "favorites": favorites});
        }
        else {
            if (favorites.dishes.indexOf(req.params.dishId) < 0) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": false, "favorites": favorites});
            }
            else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": true, "favorites": favorites});
            }
        }
    }, (err) => next(err))
    .catch((err) => next(err))
})
.post(cors.corsWithOptions, authenticate.verifyUser, 
    (req, res, next) => {
        Favorites.findOne({ user: req.user._id }, (err, favorite) => {
            if (err) return err;

            if (!favorite) {
                Favorites.create({ user: req.user._id })
                .then((favorite) => {
                    favorite.dishes.push({"_id":req.params.dishId});
                    favorite.save()
                    .then((favorite) => {
                        Favorites.findById(favorite._id)
                        .populate('user')
                        .populate('dishes')
                        .then((favorite) => {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(favorite);
                            console.log("Favorites Created");
                        });
                    })
                    .catch((err) => next(err));
                })
                .catch((err) => next(err));
            }
            else {
                if (favorite.dishes.indexOf(req.params.dishId) < 0) {
                    favorite.dishes.push({ "_id": req.params.dishId });
                    favorite.save()
                    .then((favorite) => {
                        Favorites.findById(favorite._id)
                        .populate('user')
                        .populate('dishes')
                        .then((favorite) => {
                            res.statusCode = 201;
                            res.setHeader("Content-Type", "application/json");
                            res.json(userFavs);
                            console.log("Favorites Created");
                        });
                    })
                    .catch((err) => next(err));
                }
                else {
                    res.statusCode = 403;
                    res.setHeader("Content-Type", "application/plain");
                    res.end('Dish '+ req.params.dishId+' already exists')
                }
            }
        })
    }
)

.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation is not supported on /favorites/:dishId');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id }, (err, favorite) => {
            if (err) return err;

            console.log(favorite);
            var index = favorite.dishes.indexOf(req.params.dishId);
            if (index >= 0) {
                favorite.dishes.splice(index, 1);
                favorite.save()
                .then((favorite) => {
                    Favorites.findById(favorite._id)
                    .populate('user')
                    .populate('dishes')
                    .then((favorite) => {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(userFavs);
                        console.log("Favorite deleted");
                    });
                })
                .catch((err) => next(err));
            }
            else {
                res.statusCode = 404;
                res.setHeader("Content-Type", "application/plain");
                res.end('Dish '+ req.params.dishId+' not in your favorites')
            }
        })
    }
);
module.exports = favoriteRouter;