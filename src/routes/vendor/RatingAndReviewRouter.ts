import { Router } from "express";

import Authentication from "../../Middlewares/Authnetication";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import _RS from "../../helpers/ResponseHelper";
import RatingsAndReview from "../../models/RatingsAndReview";

class VendorReviewRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.post();
    this.get();
  }

  public post() {
    // reply to a particular rating
    this.router.post(
      "/reply/:id", Authentication.vendor, [], ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const ratingId = req.params.id;
          const { message } = req.body;

          const rating = await RatingsAndReview.findById(ratingId);

          const existingReplies = rating?.replies;
          existingReplies.push({
            message: message,
            sender_id: req.user.id,
          })

          rating.replies = existingReplies;
          await rating.save()

          return _RS.api(
            res, true, "Replied Successfully", rating, startTime
          )

        } catch (error) { next(error) }
      }
    )

    this.router.put(
      "/edit/reply/:review_id/:reply_id",
      Authentication.vendor,
      [],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime()

          const { message } = req.body;
          const review = await RatingsAndReview.findById(req.params.review_id);

          if (!review) {
            return res.status(404).json({ message: "Review not found" });
          }

          // Find the index of the reply in the replies array
          const replyIndex = review.replies.findIndex((reply) =>
            reply._id.equals(req.params.reply_id)
          );

          if (replyIndex === -1) {
            return res.status(404).json({ message: "Reply not found" });
          }

          // Update the content of the reply
          review.replies[replyIndex].message = message;

          // Save the updated review
          await review.save();

          return res.status(200).json({ message: "Reply updated successfully" });
        } catch (error) {
          next(error);
        }
      }
    );
  }

  public get() {
    this.router.get(
      "/",
      Authentication.vendor,
      [],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const ratings = await RatingsAndReview.find({ reviewee_id: req.user.restaurant._id }).populate([
            { path: "reviewer_id", select: "_id name image" },
            { path: "reviewee_id", select: "_id name image" },
            { path: "reviewee_id.restaurant_id", select: "_id name image" },
            { path: "replies.sender_id", select: "_id name image" },
          ]);

          // // Populate sender details within the replies array
          // await RatingsAndReview.populate(ratings, {
          //   path: "replies.sender_id",
          //   select: "name image",
          // });

          return _RS.api(
            res, true, "Ratings Get Successfully 5", ratings, startTime
          )

        } catch (error) {
          console.error("Error:", error);
          next(error);
        }
      }
    );
  }
}

export default new VendorReviewRouter().router;