const express = require("express");
const authController = require("../controllers/auth");
const apiController = require("../controllers/spotifyApi");
const router = express.Router();

router.post('/getUserById', authController.getUserById);

router.get('/spotifyLogin', apiController.login);

router.get('/callback', apiController.callback);

router.post('/followerCount', authController.getFollowerCount);

router.post('/followingCount', authController.getFollowingCount);

router.post('/follow', authController.follow);

router.post('/unfollow', authController.unfollow);

module.exports = router;