export const paySelectCardTemplate = `

{{#if logo}}
    <div id="logo-image-holder">
        <img src="{{logo}}" id="logo-image"/>
    </div>
{{/if}}


<div id="payment-price">
    {{price}}
</div>
{{#if description}}
    <div id="payment-description">
        {{description}}
    </div>
{{/if}}


<div id="card-container">
    <div id="existing-card">
        <div id="existing-card-brand"><i class="fab fa-cc-{{card.brand}}"></i></div>
        <div id="existing-card-number">XXXX-XXXX-XXXX-{{card.last4}}</div>
    </div>
    <div id="card-errors" role="alert"></div>
    <div id="card-submit">
        {{paymentSelectCardPayButtonText}}
    </div>
    <div id="card-change">
        {{paymentSelectCardChangeCardButtonText}}
    </div>         
</div>

<div id="loading_container">
    <div id="loading">
        <i class="fas fa-circle-notch fa-spin"></i>
    </div>                
</div>        


<script>
$("#loading_container").hide();

var stripe = Stripe('{{publishableKey}}');

$("#card-change").click(function(){
    document.location='{{baseUrl}}/payment/enter-card/{{token}}'
})


$("#card-submit").click(function(){
    $("#card-errors").hide();
    $("#loading_container").show();
    stripe.confirmCardPayment('{{client_secrect}}', {
        payment_method: '{{paymentMethodId}}',
    }).then(function(result) {
        if(result.error!=null){
            $("#card-errors").text(result.error.message)
            $("#card-errors").show();
            $("#loading_container").hide();
            return;
        }
        if(result.paymentIntent != null){
            document.location = "{{baseUrl}}/payment/done/{{token}}"
        }
        console.log(result)
    });
})

</script>`;
