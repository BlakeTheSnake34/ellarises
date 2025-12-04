const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const { requireAuth, requireManager } = require('../middleware/auth');

/* ============================================================
   USER — TAKE SURVEY FORM (GET /surveys/new)
============================================================ */
router.get('/new', requireAuth, async (req, res) => {
  try {
    const events = await knex('eventoccurrences')
      .select('eventname', 'eventdatetimestart')
      .orderBy('eventdatetimestart', 'desc');

    res.render('surveys/new', {
      title: 'Take Survey',
      events
    });

  } catch (err) {
    console.error("SURVEY FORM ERROR:", err);
    req.flash('error', 'Could not load survey form.');
    res.redirect('/');
  }
});

/* ============================================================
   USER — SUBMIT SURVEY (POST /surveys)
============================================================ */
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      eventname,
      eventdatetimestart,
      surveysatisfactionscore,
      surveyusefulnessscore,
      surveyinstructorscore,
      surveyrecommendationscore,
      surveyoverallscore,
      surveynpsbucket,
      surveycomments
    } = req.body;

    await knex('surveys').insert({
      participantemail: req.session.user.email,
      eventname,
      eventdatetimestart,
      surveysatisfactionscore,
      surveyusefulnessscore,
      surveyinstructorscore,
      surveyrecommendationscore,
      surveyoverallscore,
      surveynpsbucket,
      surveycomments,
      surveysubmissiondate: new Date()
    });

    req.flash('success', 'Thank you for completing the survey!');
    res.redirect('/dashboard');

  } catch (err) {
    console.error("SURVEY SUBMIT ERROR:", err);
    req.flash('error', 'Could not submit survey.');
    res.redirect('/surveys/new');
  }
});

/* ============================================================
   MANAGER — VIEW SURVEY RESULTS (GET /surveys)
============================================================ */
router.get('/', requireManager, async (req, res) => {
  const { search = "", sort = "date_desc", page = 1, event = "" } = req.query;

  const limit = 50;
  const currentPage = parseInt(page) || 1;
  const offset = (currentPage - 1) * limit;

  try {
    let baseQuery = knex('surveys as s')
      .leftJoin('participants as p', 's.participantemail', 'p.participantemail')
      .select(
        's.participantemail',
        'p.participantfirstname',
        'p.participantlastname',
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

    // SEARCH filter
    if (search.trim() !== "") {
      baseQuery.where(function () {
        this.whereILike('p.participantfirstname', `%${search}%`)
          .orWhereILike('p.participantlastname', `%${search}%`)
          .orWhereILike('s.participantemail', `%${search}%`)
          .orWhereILike('s.eventname', `%${search}%`);
      });
    }

    // EVENT filter
    if (event.trim() !== "") {
      baseQuery.where('s.eventname', event);
    }

    // SORTING
    switch (sort) {
      case "date_asc":
        baseQuery.orderBy('s.surveysubmissiondate', 'asc');
        break;

      case "event_asc":
        baseQuery.orderBy('s.eventname', 'asc');
        break;
      case "event_desc":
        baseQuery.orderBy('s.eventname', 'desc');
        break;

      case "name_asc":
        baseQuery.orderBy('p.participantfirstname', 'asc')
          .orderBy('p.participantlastname', 'asc');
        break;
      case "name_desc":
        baseQuery.orderBy('p.participantfirstname', 'desc')
          .orderBy('p.participantlastname', 'desc');
        break;

      // CLICKABLE score sorts
      case "overall_asc":
        baseQuery.orderBy('s.surveyoverallscore', 'asc');
        break;
      case "overall_desc":
        baseQuery.orderBy('s.surveyoverallscore', 'desc');
        break;

      case "satisfaction_asc":
        baseQuery.orderBy('s.surveysatisfactionscore', 'asc');
        break;
      case "satisfaction_desc":
        baseQuery.orderBy('s.surveysatisfactionscore', 'desc');
        break;

      case "usefulness_asc":
        baseQuery.orderBy('s.surveyusefulnessscore', 'asc');
        break;
      case "usefulness_desc":
        baseQuery.orderBy('s.surveyusefulnessscore', 'desc');
        break;

      case "instructor_asc":
        baseQuery.orderBy('s.surveyinstructorscore', 'asc');
        break;
      case "instructor_desc":
        baseQuery.orderBy('s.surveyinstructorscore', 'desc');
        break;

      case "recommend_asc":
        baseQuery.orderBy('s.surveyrecommendationscore', 'asc');
        break;
      case "recommend_desc":
        baseQuery.orderBy('s.surveyrecommendationscore', 'desc');
        break;

      default:
      case "date_desc":
        baseQuery.orderBy('s.surveysubmissiondate', 'desc');
        break;
    }

    const totalResults = (await baseQuery.clone()).length;
    const totalPages = Math.ceil(totalResults / limit);
    const surveys = await baseQuery.clone().limit(limit).offset(offset);

    // Event dropdown options
    const eventsList = await knex('surveys')
      .distinct('eventname')
      .orderBy('eventname', 'asc');

    res.render('surveys/index', {
      title: 'Survey Results',
      surveys,
      search,
      sort,
      event,
      eventsList,
      currentPage,
      totalPages
    });

  } catch (err) {
    console.error("SURVEY RESULTS ERROR:", err);
    req.flash('error', 'Could not load surveys.');
    res.redirect('/');
  }
});

module.exports = router;
