const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const { requireManager } = require('../middleware/auth');

router.get('/surveys', requireManager, async (req, res) => {
  const { search = "", sort = "newest", page = 1 } = req.query;

  const limit = 50;
  const currentPage = parseInt(page) || 1;
  const offset = (currentPage - 1) * limit;

  try {
    let baseQuery = knex('surveys as s')
      .leftJoin('participants as p', 's.participantemail', 'p.participantemail')
      .select(
        's.participantemail',
        'p.participantfirstname as first_name',
        'p.participantlastname as last_name',
        's.eventname',
        's.eventdatetimestart',
        's.surveysatisfactionscore',
        's.surveyusefulnessscore',
        's.surveyinstructorscore',
        's.surveyrecommendationscore',
        's.surveyoverallscore',
        's.surveynpsbucket',
        's.surveycomments',
        's.surveysubmissiondate'
      );

    if (search.trim() !== "") {
      baseQuery.where(function () {
        this.whereILike('p.participantfirstname', `%${search}%`)
          .orWhereILike('p.participantlastname', `%${search}%`)
          .orWhereILike('s.participantemail', `%${search}%`)
          .orWhereILike('s.eventname', `%${search}%`);
      });
    }

    if (sort === "oldest") {
      baseQuery.orderBy('s.surveysubmissiondate', 'asc');
    } else {
      baseQuery.orderBy('s.surveysubmissiondate', 'desc');
    }

    const totalResults = (await baseQuery.clone()).length;
    const totalPages = Math.ceil(totalResults / limit);
    const surveys = await baseQuery.clone().limit(limit).offset(offset);

    res.render('surveys/index', {
      title: 'Survey Results',
      surveys,
      search,
      sort,
      currentPage,
      totalPages
    });

  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not load surveys.');
    res.redirect('/');
  }
});

module.exports = router;
