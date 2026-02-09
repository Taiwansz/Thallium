from extensions import db
from models import AuditLog
from flask_login import current_user
from flask import request

def log_audit(action, details=None):
    try:
        if current_user.is_authenticated:
            log = AuditLog(
                id_cliente=current_user.id_cliente,
                action=action,
                details=details,
                ip_address=request.remote_addr
            )
            db.session.add(log)
            # Note: We don't commit here immediately if this is part of a larger transaction,
            # but usually audit logs should be committed even if the main action fails?
            # Ideally yes, but for simplicity here we assume it's part of the success flow.
            # If we want it separate, we need a separate session or commit.
            # Let's rely on the caller's commit for now to ensure atomicity with the action.
    except Exception as e:
        print(f"Failed to create audit log: {e}")
