export const masterTemplate = `
<html>
    <head>
        <meta charset="UTF-8">
        <script src="https://kit.fontawesome.com/b439aafa7e.js" crossorigin="anonymous"></script>
        <script src="https://code.jquery.com/jquery-3.5.1.min.js" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet">
        <script src="https://js.stripe.com/v3/"></script>

        <style>
           {{{style}}}
        </style>
    </head>
    <body>
            {{{body}}}
    </body>
</html>

`;
