---
layout: post
title: "The current state of Xamarin.Forms vs Vanilla Xamarin"
date:   2015-04-17 18:42:60
categories: xamarin c# programming
---
When developing apps, especially when one wants to go cross platform, there really aren't any silver bullets. The only real options are HTML5 wrappers (PhoneGap, et al.), or Xamarin. Pre-iOS8(7?) HTML5 wrappers performed poorly, and to this day, they don't really target native controls (other than React Native, which only targets iOS, so is excluded from this discussion), which leads to clunky interfaces. That brings us to Xamarin:

Before _Xamarin.Forms_, the key selling point to the Xamarin suite was that one could leverage existing knowledge of .NET (particularly C# when it was first released) to develop apps for all platforms. This alone is a huge win for a ton of developers. The main problem is that you still have to code all of the UI logic separately per platform, which eliminates pretty much any code-reuse gains (as you can abstract the business logic into a service layer no matter what language you chose for the frontend). The plus side is that you gain pretty much complete control over the respective frontend UI frameworks, and Xamarin exposes almost every important API.

With Xamarin.Forms, Xamarin has abstracted the common interface elements for each platform into a 'Xamarin.Forms' controls which can be shared across platforms, thus dramatically increasing code reuse. When compiled, Xamarin performs all of the cross-platform magic to ensure everything renders properly on each device. This is all great....until you have to customize anything. This leads one into the world of 'Custom Renderers', or, separate cross-platform UI code with less power.

In order to customize any Xamarin control, a developer has to perform three steps:
1.) Create a custom control in the shared or PCL project (e.g. CustomButton). This is almost like an interface to the per-device implementation. You can include properties and methods here that will be exposed to the devices 'implementation' as well. So, lets say we want an entry whereby we can change the BorderStyle on iOS. We'd create the custom control:

{% highlight csharp %}
namespace ExampleApp.Controls
{
    public enum iOSBorderStyle
    {
        None,
        Line,
        Bezel,
        RoundedRect
    }

    public class CustomEntry : Entry 
    {
        public static readonly BindableProperty BorderStyleProperty =
            BindableProperty.Create<CustomEntry, iOSBorderStyle>(p => p.BorderStyle, iOSBorderStyle.None);

        public iOSBorderStyle BorderStyle
        {
            get { return (iOSBorderStyle)base.GetValue(BorderStyleProperty); }
            set { base.SetValue(BorderStyleProperty, value); }
        }
    }
}
{% endhighlight %}

2.) Now we have to create the 'implementation' for each platform in the respective platform's project. Continuing our example, in ExampleApp.iOS:

{% highlight csharp %}
[assembly: ExportRenderer(typeof(CustomEntry), typeof(CustomEntryRenderer))]
namespace ExampleApp.iOS.CustomRenderers
{
    public class CustomEntryRenderer : EntryRenderer
    {
        protected override void OnElementChanged(ElementChangedEventArgs<Entry> e)
        {
            base.OnElementChanged(e);

            if (Control == null)
                return;

            var entry = Control as UITextField;
            var el = Element as CustomEntry;

            switch (el.BorderStyle)
            {
                case iOSBorderStyle.None:
                   entry.BorderStyle = UITextBorderStyle.None;
                   break;
                // ...
                default:
                    entry.BorderStyle = UITextBorderStyle.Line;
                    break;
            }
        }
    }
}
{% endhighlight %}

3.) And now we can finally create this entry anywhere in our shared code:

{% highlight csharp %}
var entry = new CustomEntry { BorderStyle = iOSBorderStyle.None };
{% endhighlight %}

So, as you can see, customization is far from trivial, especially when you start getting into more advanced customizations like maps, tables, lists, etc (perhaps subjects for further posts) where there is little documentation and/or the API coverage is incomplete.

I suppose the lesson here is that Xamarin.Forms is great for applications that will:
* Need to be cross-platform in a short time frame
* Heavily leverage default platform controls
* Have little, or no need for very customized elements, animations, etc

If your app extends beyond this, I would strongly consider just biting the bullet and going with vanilla Xamarin.
