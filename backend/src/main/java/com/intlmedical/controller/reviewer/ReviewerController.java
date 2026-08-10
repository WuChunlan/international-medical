package com.intlmedical.controller.reviewer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.intlmedical.entity.*;
import com.intlmedical.mapper.*;
import com.intlmedical.service.PendingChangeService;
import com.intlmedical.util.Result;
import com.intlmedical.util.SecurityUtil;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviewer")
@RequiredArgsConstructor
public class ReviewerController {

    private final HospitalMapper hospitalMapper;
    private final DoctorMapper doctorMapper;
    private final EquipmentMapper equipmentMapper;
    private final HospitalEnvironmentMapper hospitalEnvironmentMapper;
    private final CaseMapper caseMapper;
    private final SpecialProductMapper specialProductMapper;
    private final ProductVariantMapper productVariantMapper;
    private final PendingChangeMapper pendingChangeMapper;
    private final PendingChangeService pendingChangeService;
    private final ObjectMapper objectMapper;

    /** Wraps a pending item with metadata for the reviewer UI. */
    record PendingItem(Object data, boolean isEdit, Object currentData, Long pendingChangeId) {}

    // ── all-hospitals list ────────────────────────────────────────────────────

    @GetMapping("/hospitals")
    public Result<List<Hospital>> allHospitals() {
        return Result.ok(hospitalMapper.selectList(null));
    }

    // ── pending lists (new records + pending edits) ───────────────────────────

    @GetMapping("/pending/hospitals")
    public Result<List<PendingItem>> pendingHospitals() {
        // Hospitals are always stored with entity_id set (even new creates, to bind hospitalId to user).
        // New creates have auditStatus='pending' in the hospitals table itself.
        // Edits have an existing approved hospital + a pending_changes record.
        List<PendingChange> pending = pendingChangeMapper.selectPendingByType("hospitals")
            .stream().filter(pc -> pc.getEntityId() != null).toList();
        List<PendingItem> items = new ArrayList<>();
        pending.forEach(pc -> {
            Hospital current = hospitalMapper.selectById(pc.getEntityId());
            if (current != null) {
                try {
                    Object pendingData = objectMapper.readValue(pc.getPendingData(), Map.class);
                    boolean isNewHospital = "pending".equals(current.getAuditStatus());
                    items.add(new PendingItem(pendingData, !isNewHospital, isNewHospital ? null : current, pc.getId()));
                } catch (Exception e) { /* skip malformed */ }
            }
        });
        return Result.ok(items);
    }

    @GetMapping("/pending/doctors")
    public Result<List<PendingItem>> pendingDoctors() {
        List<PendingChange> newDrafts = pendingChangeMapper.selectNewDraftsByType("doctors");
        List<PendingChange> edits = pendingChangeMapper.selectPendingByType("doctors")
            .stream().filter(pc -> pc.getEntityId() != null).toList();
        List<PendingItem> items = new ArrayList<>();
        newDrafts.forEach(pc -> {
            try {
                Object pendingData = objectMapper.readValue(pc.getPendingData(), Map.class);
                items.add(new PendingItem(pendingData, false, null, pc.getId()));
            } catch (Exception e) { /* skip malformed */ }
        });
        edits.forEach(pc -> {
            Doctor current = doctorMapper.selectById(pc.getEntityId());
            if (current != null) {
                try {
                    Object pendingData = objectMapper.readValue(pc.getPendingData(), Map.class);
                    items.add(new PendingItem(pendingData, true, current, pc.getId()));
                } catch (Exception e) { /* skip malformed */ }
            }
        });
        return Result.ok(items);
    }

    @GetMapping("/pending/equipments")
    public Result<List<PendingItem>> pendingEquipments() {
        List<PendingChange> newDrafts = pendingChangeMapper.selectNewDraftsByType("equipments");
        List<PendingChange> edits = pendingChangeMapper.selectPendingByType("equipments")
            .stream().filter(pc -> pc.getEntityId() != null).toList();
        List<PendingItem> items = new ArrayList<>();
        newDrafts.forEach(pc -> {
            try {
                Object pendingData = objectMapper.readValue(pc.getPendingData(), Map.class);
                items.add(new PendingItem(pendingData, false, null, pc.getId()));
            } catch (Exception e) { /* skip malformed */ }
        });
        edits.forEach(pc -> {
            Equipment current = equipmentMapper.selectById(pc.getEntityId());
            if (current != null) {
                try {
                    Object pendingData = objectMapper.readValue(pc.getPendingData(), Map.class);
                    items.add(new PendingItem(pendingData, true, current, pc.getId()));
                } catch (Exception e) { /* skip malformed */ }
            }
        });
        return Result.ok(items);
    }

    @GetMapping("/pending/environments")
    public Result<List<PendingItem>> pendingEnvironments() {
        List<PendingChange> newDrafts = pendingChangeMapper.selectNewDraftsByType("environments");
        List<PendingChange> edits = pendingChangeMapper.selectPendingByType("environments")
            .stream().filter(pc -> pc.getEntityId() != null).toList();
        List<PendingItem> items = new ArrayList<>();
        newDrafts.forEach(pc -> {
            try {
                Object pendingData = objectMapper.readValue(pc.getPendingData(), Map.class);
                items.add(new PendingItem(pendingData, false, null, pc.getId()));
            } catch (Exception e) { /* skip malformed */ }
        });
        edits.forEach(pc -> {
            HospitalEnvironment current = hospitalEnvironmentMapper.selectById(pc.getEntityId());
            if (current != null) {
                try {
                    Object pendingData = objectMapper.readValue(pc.getPendingData(), Map.class);
                    items.add(new PendingItem(pendingData, true, current, pc.getId()));
                } catch (Exception e) { /* skip malformed */ }
            }
        });
        return Result.ok(items);
    }

    @GetMapping("/pending/cases")
    public Result<List<PendingItem>> pendingCases() {
        List<PendingChange> newDrafts = pendingChangeMapper.selectNewDraftsByType("cases");
        List<PendingChange> edits = pendingChangeMapper.selectPendingByType("cases")
            .stream().filter(pc -> pc.getEntityId() != null).toList();
        List<PendingItem> items = new ArrayList<>();
        newDrafts.forEach(pc -> {
            try {
                Object pendingData = objectMapper.readValue(pc.getPendingData(), Map.class);
                items.add(new PendingItem(pendingData, false, null, pc.getId()));
            } catch (Exception e) { /* skip malformed */ }
        });
        edits.forEach(pc -> {
            Case current = caseMapper.selectById(pc.getEntityId());
            if (current != null) {
                try {
                    Object pendingData = objectMapper.readValue(pc.getPendingData(), Map.class);
                    items.add(new PendingItem(pendingData, true, current, pc.getId()));
                } catch (Exception e) { /* skip malformed */ }
            }
        });
        return Result.ok(items);
    }

    @GetMapping("/pending/products")
    public Result<List<PendingItem>> pendingProducts() {
        List<PendingChange> newDrafts = pendingChangeMapper.selectNewDraftsByType("products");
        List<PendingChange> edits = pendingChangeMapper.selectPendingByType("products")
            .stream().filter(pc -> pc.getEntityId() != null).toList();
        List<PendingItem> items = new ArrayList<>();
        newDrafts.forEach(pc -> {
            try {
                Object pendingData = objectMapper.readValue(pc.getPendingData(), Map.class);
                items.add(new PendingItem(pendingData, false, null, pc.getId()));
            } catch (Exception e) { /* skip malformed */ }
        });
        edits.forEach(pc -> {
            SpecialProduct current = specialProductMapper.selectById(pc.getEntityId());
            if (current != null) {
                try {
                    List<ProductVariant> currentVariants = productVariantMapper.selectList(
                        new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ProductVariant>()
                            .eq(ProductVariant::getProductId, pc.getEntityId())
                            .eq(ProductVariant::getIsActive, 1)
                    );
                    current.setVariants(currentVariants);
                    Object pendingData = objectMapper.readValue(pc.getPendingData(), Map.class);
                    items.add(new PendingItem(pendingData, true, current, pc.getId()));
                } catch (Exception e) { /* skip malformed */ }
            }
        });
        return Result.ok(items);
    }

    // ── approve ──────────────────────────────────────────────────────────────

    /** Approve an edit to an existing entity (entity_id is known). */
    @PutMapping("/approve/{type}/{id}")
    public Result<?> approve(@PathVariable String type, @PathVariable Long id) {
        Long reviewerId = SecurityUtil.getCurrentUserId();
        PendingChange pc = pendingChangeMapper.selectByEntity(type, id);
        if (pc == null || !"pending".equals(pc.getAuditStatus())) {
            return Result.fail(404, "未找到待审核记录");
        }
        try {
            pendingChangeService.applyApproval(type, id, pc, reviewerId);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            return Result.fail("审核失败，请重试");
        }
        return Result.ok();
    }

    /** Approve a pending change (new draft or edit) by pending_change.id. */
    @PutMapping("/approve-draft/{type}/{pcId}")
    public Result<?> approveDraft(@PathVariable String type, @PathVariable Long pcId) {
        Long reviewerId = SecurityUtil.getCurrentUserId();
        PendingChange pc = pendingChangeMapper.selectById(pcId);
        if (pc == null || !"pending".equals(pc.getAuditStatus())) {
            return Result.fail(404, "未找到待审核记录");
        }
        try {
            pendingChangeService.applyApproval(type, pc.getEntityId(), pc, reviewerId);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            return Result.fail("审核失败，请重试");
        }
        return Result.ok();
    }

    // ── reject ──────────────────────────────────────────────────────────────

    /** Reject an edit to an existing entity. */
    @PutMapping("/reject/{type}/{id}")
    public Result<?> reject(@PathVariable String type, @PathVariable Long id,
                            @RequestBody(required = false) Map<String, String> body) {
        Long reviewerId = SecurityUtil.getCurrentUserId();
        String reason = body != null ? body.get("reason") : null;
        PendingChange pc = pendingChangeMapper.selectByEntity(type, id);
        if (pc == null || !"pending".equals(pc.getAuditStatus())) {
            return Result.fail(404, "未找到待审核记录");
        }
        pendingChangeService.applyRejection(pc, reason, reviewerId);
        return Result.ok();
    }

    /** Reject a pending change (new draft or edit) by pending_change.id. */
    @PutMapping("/reject-draft/{type}/{pcId}")
    public Result<?> rejectDraft(@PathVariable String type, @PathVariable Long pcId,
                                 @RequestBody(required = false) Map<String, String> body) {
        Long reviewerId = SecurityUtil.getCurrentUserId();
        String reason = body != null ? body.get("reason") : null;
        if (reason == null || reason.isBlank()) {
            return Result.fail(400, "驳回原因不能为空");
        }
        PendingChange pc = pendingChangeMapper.selectById(pcId);
        if (pc == null || !"pending".equals(pc.getAuditStatus())) {
            return Result.fail(404, "未找到待审核记录");
        }
        pendingChangeService.applyRejection(pc, reason, reviewerId);
        return Result.ok();
    }

    // ── edit (reviewer direct edit, keeps current audit_status) ─────────────

    @PutMapping("/edit/hospitals/{id}")
    public Result<Void> editHospital(@PathVariable Long id, @RequestBody Hospital h) {
        h.setId(id);
        hospitalMapper.updateById(h);
        return Result.ok();
    }

    @PutMapping("/edit/doctors/{id}")
    public Result<Void> editDoctor(@PathVariable Long id, @RequestBody Doctor d) {
        d.setId(id);
        doctorMapper.updateById(d);
        return Result.ok();
    }

    @PutMapping("/edit/equipments/{id}")
    public Result<Void> editEquipment(@PathVariable Long id, @RequestBody Equipment e) {
        e.setId(id);
        equipmentMapper.updateById(e);
        return Result.ok();
    }

    @PutMapping("/edit/environments/{id}")
    public Result<Void> editEnvironment(@PathVariable Long id, @RequestBody HospitalEnvironment env) {
        env.setId(id);
        hospitalEnvironmentMapper.updateById(env);
        return Result.ok();
    }

    @PutMapping("/edit/cases/{id}")
    public Result<Void> editCase(@PathVariable Long id, @RequestBody Case c) {
        c.setId(id);
        caseMapper.updateById(c);
        return Result.ok();
    }

    @PutMapping("/edit/products/{id}")
    public Result<Void> editProduct(@PathVariable Long id, @RequestBody SpecialProduct p) {
        p.setId(id);
        specialProductMapper.updateById(p);
        return Result.ok();
    }

    // ── helper ───────────────────────────────────────────────────────────────

    @Data
    public static class RejectRequest {
        private String reason;
    }
}
