package com.intlmedical.config;

import com.intlmedical.service.SiteConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final SiteConfigService siteConfigService;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        try {
            String basePath = siteConfigService.getByKey("upload_base_path").getValueZh();
            // Ensure path ends with separator
            if (!basePath.endsWith("/")) basePath += "/";
            registry.addResourceHandler("/media/**")
                    .addResourceLocations("file:" + basePath);
        } catch (Exception ignored) {
            // Config not yet loaded (e.g., first run before DB seed)
        }
    }
}
