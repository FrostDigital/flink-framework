export const payEnterCardTemplate = `

{{#if logo}}
    <div id="logo-image-holder">
        <img src="{{logo}}" id="logo-image"/>
    </div>
{{/if}}



<div id="card-container">

    <div id="card-element">
    <!-- Elements will create input elements here -->
    </div>

    <div id="card-errors" role="alert"></div>

    <div id="card-submit">
        {{paymentEnterCardPayButtonText}}
    </div>



</div>


<div id="loading_container">
    <div id="loading">
        <i class="fas fa-circle-notch fa-spin"></i>
    </div>                
</div>        


<script>
var stripe = Stripe('{{publishableKey}}');
var elements = stripe.elements();

var style = {
    base: {
        color: "#32325d",
    }
};

var card = elements.create("card", { style: style });
card.mount("#card-element");      
card.on('ready',function(){
    $("#loading_container").hide();
})



card.addEventListener('change', function(event) {
    if (event.error) {
        $("#card-errors").text(event.error.message)
        $("#card-errors").show();
    } else {
        $("#card-errors").text('')
        $("#card-errors").hide();
        
    }
});



$("#card-submit").click(function(){
    $("#card-errors").hide();
    $("#loading_container").show();
    stripe.confirmCardPayment('{{client_secrect}}', {
        payment_method: { card: card  },
        setup_future_usage: 'off_session'
    }).then(function(result) {
        if(result.error!=null){
            $("#card-errors").text(result.error.message)
            $("#card-errors").show();
            $("#loading_container").hide();
            return;
        }

        if(result.paymentIntent != null){
            document.location = "{{baseUrl}}/payment/done/{{token}}";
        }
    });
})

</script>`;
