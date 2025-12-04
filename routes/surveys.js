const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const { requireAuth, requireManager } = require('../middleware/auth');

/* ============================================================
   USER — SURVEY DASHBOARD (GET /surveys/new)
   Shows attended events + survey completion status
============================================================ */
router.get('/new', requireAuth, async (req, res) => {
  try {
    const userEmail = req.session.user.email;

    const events = await knex('eventoccurrences as eo')
      .leftJoin('registrations as r', function () {
        this.on('eo.eventname', '=', 'r.eventname')
            .andOn('eo.eventdatetimestart', '=', 'r.eventdatetimestart');
      })
      .leftJoin('surveys as s', function () {
        this.on('eo.eventname', '=', 's.eventname')
            .andOn('eo.eventdatetimestart', '=', 's.eventdatetimestart')
            .andOn('s.participantemail', '=', knex.raw('?', [userEmail]));
      })
      .where('r.participantemail', userEmail)
      .andWhere('r.registrationattendedflag', true)
      .select(
        'eo.eventname',
        'eo.eventdatetimestart',
        's.surveysubmissiondate'
      )
      .orderBy('eo.eventdatetimestart', 'desc');

    res.render('surveys/start', {
      title: "Your Event Surveys",
      events
    });

  } catch (err) {
    console.error("SURVEY NEW PAGE ERROR:", err);
    req.flash("error", "Could not load your survey dashboard.");
    res.redirect('/home');
  }
});

/* ============================================================
   USER — TAKE SURVEY FORM (GET /surveys/start/:name/:isoDate)
============================================================ */
router.get('/start/:eventname/:eventdatetimestart', requireAuth, async (req, res) => {
  try {
    const eventName = decodeURIComponent(req.params.eventname);
    const isoDate = decodeURIComponent(req.params.eventdatetimestart); // already ISO

    const event = await knex('eventoccurrences')
      .where({
        eventname: eventName,
        eventdatetimestart: isoDate
      })
      .first();

    if (!event) {
      req.flash("error", "Event not found.");
      return res.redirect('/surveys/new');
    }

    res.render('surveys/take', {
      title: "Take Survey",
      event,
      csrfToken: req.csrfToken()
    });

  } catch (err) {
    console.error("SURVEY START ERROR:", err);
    req.flash("error", "Could not load survey form.");
    res.redirect('/surveys/new');
  }
});

/* ============================================================
   USER — SUBMIT SURVEY
============================================================ */
router.post('/', requireAuth, async (req, res) => {
  try {
    const userEmail = req.session.user.email;

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
      participantemail: userEmail,
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

    req.flash("success", "Survey submitted successfully!");
    res.redirect('/surveys/new');

  } catch (err) {
    console.error("SURVEY SUBMIT ERROR:", err);
    req.flash("error", "Could not submit survey.");
    res.redirect('/surveys/new');
  }
});

/* ============================================================
   MANAGER — VIEW ALL SURVEYS (GET /surveys)
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

    if (search.trim() !== "") {
      baseQuery.where(function () {
        this.whereILike('p.participantfirstname', `%${search}%`)
          .orWhereILike('p.participantlastname', `%${search}%`)
          .orWhereILike('s.participantemail', `%${search}%`)
          .orWhereILike('s.eventname', `%${search}%`);
      });
    }

    if (event.trim() !== "") {
      baseQuery.where('s.eventname', event);
    }

    switch (sort) {
      case "event_asc": baseQuery.orderBy('s.eventname', 'asc'); break;
      case "event_desc": baseQuery.orderBy('s.eventname', 'desc'); break;
      case "name_asc": baseQuery.orderBy('p.participantfirstname', 'asc').orderBy('p.participantlastname', 'asc'); break;
      case "name_desc": baseQuery.orderBy('p.participantfirstname', 'desc').orderBy('p.participantlastname', 'desc'); break;
      case "overall_asc": baseQuery.orderBy('s.surveyoverallscore', 'asc'); break;
      case "overall_desc": baseQuery.orderBy('s.surveyoverallscore', 'desc'); break;
      default:
      case "date_desc": baseQuery.orderBy('s.surveysubmissiondate', 'desc');
    }

    const totalResults = (await baseQuery.clone()).length;
    const totalPages = Math.ceil(totalResults / limit);
    const surveys = await baseQuery.clone().limit(limit).offset(offset);

    const eventsList = await knex('surveys')
      .distinct('eventname')
      .orderBy('eventname', 'asc');

    res.render('surveys/index', {
      title: "Survey Results",
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
    req.flash("error", "Could not load surveys.");
    res.redirect('/');
  }
});

module.exports = router;
