<!DOCTYPE html>
<html>
<head>
  <title><%= title %></title>
  <link rel="stylesheet" href="/css/main.css">

  <style>
    .dashboard-container {
      width: 100%;
      max-width: 1600px;
      margin: 0 auto;
    }

    .tableauPlaceholder {
      width: 100%;
      height: 80vh;
    }
  </style>
</head>

<body>

  <%- include('../partials/_nav') %>
  <%- include('../partials/_flash') %>

  <div class="page-wrap">
    <div class="page">
      <h1>Dashboard</h1>

      <div class="dashboard-container">

        <!-- Tableau Embed Code -->
        <div class='tableauPlaceholder' id='viz1764801900541' style='position: relative'>
          <noscript>
            <a href='#'>
              <img alt=' ' src='https://public.tableau.com/static/images/In/IntexDashboard-Group6/Dashboard1/1_rss.png' style='border: none' />
            </a>
          </noscript>

          <object class='tableauViz' style='display:none;'>
            <param name='host_url' value='https%3A%2F%2Fpublic.tableau.com%2F' />
            <param name='embed_code_version' value='3' />
            <param name='site_root' value='' />
            <param name='name' value='IntexDashboard-Group6/Dashboard1' />
            <param name='tabs' value='yes' />
            <param name='toolbar' value='yes' />
            <param name='static_image' value='https://public.tableau.com/static/images/In/IntexDashboard-Group6/Dashboard1/1.png' />
            <param name='animate_transition' value='yes' />
            <param name='display_static_image' value='yes' />
            <param name='display_spinner' value='yes' />
            <param name='display_overlay' value='yes' />
            <param name='display_count' value='yes' />
            <param name='language' value='en-US' />
          </object>
        </div>

        <script type='text/javascript'>
          var divElement = document.getElementById('viz1764801900541');
          var vizElement = divElement.getElementsByTagName('object')[0];

          if (divElement.offsetWidth > 800) {
            vizElement.style.minWidth = '1500px';
            vizElement.style.maxWidth = '100%';
            vizElement.style.minHeight = '1150px';
            vizElement.style.maxHeight = (divElement.offsetWidth * 0.75) + 'px';
          } else if (divElement.offsetWidth > 500) {
            vizElement.style.minWidth = '1500px';
            vizElement.style.maxWidth = '100%';
            vizElement.style.minHeight = '1150px';
            vizElement.style.maxHeight = (divElement.offsetWidth * 0.75) + 'px';
          } else {
            vizElement.style.width = '100%';
            vizElement.style.minHeight = '2250px';
            vizElement.style.maxHeight = (divElement.offsetWidth * 1.77) + 'px';
          }

          var scriptElement = document.createElement('script');
          scriptElement.src = 'https://public.tableau.com/javascripts/api/viz_v1.js';
          vizElement.parentNode.insertBefore(scriptElement, vizElement);
        </script>

      </div> <!-- dashboard-container -->
    </div> <!-- page -->
  </div> <!-- page-wrap -->

</body>
</html>
