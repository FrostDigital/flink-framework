export const connectDoneTemplate = `
    <div id="success">
    <i class="fas fa-check"></i>
    <div id="sucess_message">{{message}}</div>
    </div>

    {{#if redirectUrl}}
        <script>
            setTimeout(function(){
                    window.location="{{redirectUrl}}";
            }, 1000)
        </script>
    {{/if}}
`;
