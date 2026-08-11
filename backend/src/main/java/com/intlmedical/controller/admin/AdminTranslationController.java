package com.intlmedical.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.intlmedical.entity.ContentTranslation;
import com.intlmedical.entity.TranslationJob;
import com.intlmedical.entity.TranslationJobItem;
import com.intlmedical.entity.User;
import com.intlmedical.mapper.UserMapper;
import com.intlmedical.service.ContentTranslationService;
import com.intlmedical.service.SiteConfigService;
import com.intlmedical.service.TranslationJobService;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin 翻译配置接口：语种管理、翻译管理员账号、全量翻译任务
 */
@RestController
@RequestMapping("/api/admin/translation")
@RequiredArgsConstructor
public class AdminTranslationController {

    private final ContentTranslationService translationService;
    private final TranslationJobService jobService;
    private final SiteConfigService siteConfigService;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    // ── 语种配置 ────────────────────────────────────────────────────────────────

    /** 获取当前配置的目标语种列表 */
    @GetMapping("/langs")
    public Result<List<String>> getLangs() {
        return Result.ok(translationService.getTargetLangs());
    }

    /** 新增语种（写入配置 + 自动触发该语种的全量翻译任务） */
    @PostMapping("/langs/{lang}")
    public Result<TranslationJob> addLang(@PathVariable String lang) {
        List<String> current = translationService.getTargetLangs();
        if (!current.contains(lang)) {
            List<String> updated = new java.util.ArrayList<>(current);
            updated.add(lang);
            siteConfigService.update("translate_target_langs", null,
                String.join(",", updated));
        }
        TranslationJob job = jobService.startJob(lang);
        return Result.ok(job);
    }

    /** 删除语种（仅从配置中移除，不删除已翻译内容） */
    @DeleteMapping("/langs/{lang}")
    public Result<Void> removeLang(@PathVariable String lang) {
        List<String> current = translationService.getTargetLangs();
        List<String> updated = current.stream()
            .filter(l -> !l.equalsIgnoreCase(lang))
            .collect(java.util.stream.Collectors.toList());
        siteConfigService.update("translate_target_langs", null,
            String.join(",", updated));
        return Result.ok(null);
    }

    // ── 翻译管理员账号 ──────────────────────────────────────────────────────────

    /** 列出所有翻译管理员账号 */
    @GetMapping("/admins")
    public Result<List<User>> listAdmins() {
        List<User> list = userMapper.selectList(
            new LambdaQueryWrapper<User>().eq(User::getRoleId, 6)
        );
        list.forEach(u -> u.setPasswordHash(null));
        return Result.ok(list);
    }

    /** 创建翻译管理员账号 */
    @PostMapping("/admins")
    public Result<Void> createAdmin(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        String managedLang = body.get("managedLang");
        String firstName = body.getOrDefault("firstName", "");
        String lastName = body.getOrDefault("lastName", "");

        boolean exists = userMapper.exists(
            new LambdaQueryWrapper<User>().eq(User::getEmail, email)
        );
        if (exists) return Result.fail("邮箱已存在");

        User user = new User();
        user.setRoleId(6);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setManagedLang(managedLang);
        user.setIsActive(1);
        user.setMustChangePassword(1);
        userMapper.insert(user);
        return Result.ok(null);
    }

    /** 更新翻译管理员（语言、启用状态） */
    @PutMapping("/admins/{id}")
    public Result<Void> updateAdmin(@PathVariable Long id,
                                    @RequestBody Map<String, Object> body) {
        var update = new LambdaUpdateWrapper<User>().eq(User::getId, id);
        if (body.containsKey("managedLang")) {
            update.set(User::getManagedLang, body.get("managedLang"));
        }
        if (body.containsKey("isActive")) {
            update.set(User::getIsActive, Integer.valueOf(body.get("isActive").toString()));
        }
        userMapper.update(null, update);
        return Result.ok(null);
    }

    /** 删除翻译管理员账号 */
    @DeleteMapping("/admins/{id}")
    public Result<Void> deleteAdmin(@PathVariable Long id) {
        userMapper.deleteById(id);
        return Result.ok(null);
    }

    // ── 全量翻译任务 ────────────────────────────────────────────────────────────

    /** 启动全量翻译任务 */
    @PostMapping("/jobs")
    public Result<TranslationJob> startJob(@RequestBody Map<String, String> body) {
        String lang = body.get("lang");
        TranslationJob job = jobService.startJob(lang);
        return Result.ok(job);
    }

    /** 取消任务 */
    @PostMapping("/jobs/{id}/cancel")
    public Result<Void> cancelJob(@PathVariable Long id) {
        jobService.cancelJob(id);
        return Result.ok(null);
    }

    /** 任务列表 */
    @GetMapping("/jobs")
    public Result<List<TranslationJob>> listJobs(
            @RequestParam(required = false) String lang) {
        return Result.ok(jobService.listJobs(lang));
    }

    /** 单个任务详情 */
    @GetMapping("/jobs/{id}")
    public Result<TranslationJob> getJob(@PathVariable Long id) {
        return Result.ok(jobService.getJob(id));
    }

    /** 任务明细列表（支持按状态过滤） */
    @GetMapping("/jobs/{id}/items")
    public Result<List<TranslationJobItem>> listItems(
            @PathVariable Long id,
            @RequestParam(required = false) String status) {
        return Result.ok(jobService.listItems(id, status));
    }

    /** 重试单个失败条目 */
    @PostMapping("/jobs/items/{itemId}/retry")
    public Result<Void> retryItem(@PathVariable Long itemId) {
        jobService.retryItem(itemId);
        return Result.ok(null);
    }

    // ── 全局失败列表 ────────────────────────────────────────────────────────────

    /** 查询所有翻译失败的 content_translation 记录 */
    @GetMapping("/failed")
    public Result<List<ContentTranslation>> listFailed() {
        return Result.ok(translationService.listFailed());
    }

    /** 重试单条 content_translation 失败记录（传入最新中文原文） */
    @PostMapping("/failed/{id}/retry")
    public Result<Void> retryFailed(@PathVariable Long id,
                                    @RequestBody Map<String, String> body) {
        String zhText = body.get("zhText");
        if (zhText == null || zhText.isBlank()) return Result.fail("zhText 不能为空");
        translationService.retryFailed(id, zhText);
        return Result.ok(null);
    }
}
