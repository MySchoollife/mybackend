import moment = require("moment");

import User from "../models/User";

export const calculatePeriod = ({ period, year }) => {
  const currentDate = moment().year(year); // Set the current date to the beginning of the given year
  let startDate, endDate;
  if (period === "weekly") {
    startDate = moment(currentDate).startOf("week").toDate(); // Start of the week
    endDate = moment(currentDate).endOf("week").toDate(); // End of the week
  } else if (period === "monthly") {
    startDate = moment(currentDate).startOf("month").toDate(); // Start of the month
    endDate = moment(currentDate).endOf("month").toDate(); // End of the month
  } else {
    // Default to yearly
    startDate = moment(currentDate).startOf("year").toDate(); // Start of the year
    endDate = moment(currentDate).endOf("year").toDate(); // End of the year
  }

  return { startDate, endDate };
};

export const timeStringToSeconds = async (timeString) => {
  const [hours, minutes] = timeString.split(":").map(Number);
  console.log(hours, minutes, "approx time");

  if (!hours && !minutes) return 10000;
  const totalSeconds = hours * 3600 + minutes * 60;
  return totalSeconds;
};

export const getUser = async ({ interval, year }) => {
  const startOfYear = new Date(`${year}-01-01`);
  const endOfYear = new Date(`${year + 1}-01-01`);
  const pipeline = [
    {
      $match: {
        is_delete: false,
        created_at: {
          $gte: startOfYear,
          $lt: endOfYear,
        },
      },
    },
    {
      $group: {
        _id: {
          $switch: {
            branches: [
              {
                case: { $eq: [interval, "monthly"] },
                then: {
                  $dateToString: {
                    format: "%m",
                    date: "$created_at",
                  },
                },
              },
              {
                case: { $eq: [interval, "weekly"] },
                then: {
                  $dateToString: {
                    format: "%U",
                    date: "$created_at",
                  },
                },
              },
              {
                case: { $eq: [interval, "quarterly"] },
                then: {
                  $concat: [
                    // { $toString: { $year: "$created_at" } },
                    // "-",
                    {
                      $cond: [
                        { $lte: [{ $month: "$created_at" }, 3] },
                        "Q1",
                        {
                          $cond: [
                            { $lte: [{ $month: "$created_at" }, 6] },
                            "Q2",
                            {
                              $cond: [
                                { $lte: [{ $month: "$created_at" }, 9] },
                                "Q3",
                                "Q4",
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            ],
            default: null,
          },
        },
        // total_amount: { $sum: "$restaurant_amount" }
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        interval: "$_id",
        count: 1,
      },
    },
    {
      $sort: {
        "interval.year": 1,
        "interval.month": 1,
        "interval.week": 1,
        "interval.quarter": 1,
      },
    },
  ];

  const [
    user,
    activeUser,
    provider,
    categories,
    events,
    services,
    quotation,
    pendingQuotation,
    supportCases,
    accPerformance,
    Onboardings,
    visitors,
  ] = await Promise.all([
    User.aggregate([
      {
        $match: {
          type: "Customer",
        },
      },
      ...pipeline,
    ]),
    User.aggregate([
      [
        {
          $match: {
            is_active: true,
            type: "Customer",
          },
        },
        ...pipeline,
      ],
    ]),
    User.aggregate(pipeline),
    User.aggregate(pipeline),
    User.aggregate(pipeline),
    User.aggregate(pipeline),
    User.aggregate(pipeline),
    User.aggregate([
      [
        {
          $match: {
            approve_status: "Pending",
          },
        },
        ...pipeline,
      ],
    ]),
    User.aggregate(pipeline),
    User.aggregate(pipeline),
    User.aggregate(pipeline),
    User.aggregate(pipeline),
  ]);

  return {
    user: user.map((entry) => entry),
    activeUser: activeUser.map((entry) => entry),
    provider: provider.map((entry) => entry),
    categories: categories.map((entry) => entry),
    events: events.map((entry) => entry),
    services: services.map((entry) => entry),
    quotation: quotation.map((entry) => entry),
    pendingQuotation: pendingQuotation.map((entry) => entry),
    supportCases: supportCases.map((entry) => entry),
    accPerformance: accPerformance.map((entry) => entry),
    Onboardings: Onboardings.map((entry) => entry),
    visitors: visitors.map((entry) => entry),
  };
};
