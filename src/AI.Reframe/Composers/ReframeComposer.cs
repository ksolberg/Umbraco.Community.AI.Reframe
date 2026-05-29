using AI.Reframe.Reframing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace AI.Reframe.Composers;

/// <summary>Registers the Reframe services, options binding, and the OpenAI-backed image provider.</summary>
public class ReframeComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services
            .AddOptions<AIReframeOptions>()
            .Bind(builder.Config.GetSection(AIReframeOptions.SectionName));

        builder.Services.AddMemoryCache();

        builder.Services.AddTransient<ReframeMediaReader>();
        builder.Services.AddTransient<ReframeMediaWriter>();
        builder.Services.AddSingleton<ReframeCandidateCache>();

        // The shippable provider: a self-contained OpenAI gpt-image-2 client (ADR-0003). An
        // Umbraco.AI-backed provider can replace this registration once that image capability ships.
        builder.Services.AddHttpClient<IReframeImageProvider, OpenAiGptImageProvider>((sp, client) =>
        {
            var options = sp.GetRequiredService<IOptions<AIReframeOptions>>().Value;
            client.Timeout = TimeSpan.FromSeconds(Math.Max(1, options.OpenAI.TimeoutSeconds));
        });
    }
}
