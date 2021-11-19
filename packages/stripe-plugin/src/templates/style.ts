export const styleTemplate = `
    body{
        font-family: 'Open Sans';
        background-color:#fff;
        color:#000
    }
    #loading_container{
        background-color:rgba(255,255,255,0.6);
        color:#000;
        position: fixed;
        left:0px;
        right:0px;
        top:0px;
        bottom:0px;
        z-index:1000;
        font-size:128px;
    }
    #loading{
        position: absolute;
        left:50%;
        top:50%;
        transform:translate(-50%,-50%)
    }            
    #card-element{
        padding : 20px;
        border : 1px solid rgb(185, 185, 185);
        border-radius: 5px;
        background-color : #fff;
        box-shadow : 0px 5px 16px -2px rgba(0,0,0,0.25);
    }
    #logo-image{
        width: 200px;
        margin-bottom: 20px;
    }
    #logo-image-holder{
        text-align : center;
    }
    #logo-icon{
        font-size : 72px;
        text-align : center;
        margin-bottom : 20px;
        margin-top : 20px
    }            
    #card-container{
        margin-top : 20px
    }            
    #card-submit{
        margin-top: 20px;
        text-align: center;
        padding: 20px;
        color: #fff;
        background-color: #000;
        box-shadow: 0px 5px 16px -2px rgba(0,0,0,0.25);
        border-radius: 5px;
    }            
    #card-errors{
        background-color: #ff3f34,
        color : #fff,
        padding : 20px,
        border-radius : 5px,
        margin-top : 20px,
        display : none
    }
    #payment-amount-container{
        font-size : 48px,
        text-align : center,
        margin-bottom : 20px,
        color : #000

    }
    #payment-amount-description-container{
        text-align : center;
        font-size : 24px;
    }    
    #setup_description{
        text-align : center;
        margin-bottom : 20px;
    }

    #success{
        position: fixed;
        left:50%;
        top:50%;
        transform: translate(-50%,-50%);
        font-size:128px;
        color:##Colors.success##;
        text-align:center
        
    }
    #sucess_message{
        color:#000;
        font-size:20px;
        margin-top:10px;
    }

    #existing-card{
        background-color: #fff;
        border-radius: 10px;
        position: relative;
        display: flex;
        align-items: center;
    }
    #existing-card-brand{
        font-size: 46px;
        color : #171531;
        flex:1
    }
    #existing-card-number{
        color: #171531;
    }            
    
    #card-change{
        margin-top: 20px;
        text-align: center;
        padding: 20px;
        color: #fff;
        background-color: #000;
        box-shadow: 0px 5px 16px -2px rgba(0,0,0,0.25);
        border-radius: 5px;
    }


    #payment-price{
        text-align: center;
        font-size: 32px;
    }

    #payment-description{
        text-align: center;
        font-style: italic;
    }
  


`;
